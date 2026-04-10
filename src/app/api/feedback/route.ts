import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Entry = {
  id: string;
  text: string;
  createdAt: string;
};

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (_redis) return _redis;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Redis env vars not set (KV_REST_API_URL / KV_REST_API_TOKEN)");
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const LIST_KEY = "feedback:entries";
const MAX_LENGTH = 2000;
const MAX_ENTRIES_PER_RESPONSE = 500;
const MAX_ENTRIES_STORED = 1000;

export async function GET() {
  const raw = await getRedis().lrange<Entry | string>(LIST_KEY, 0, MAX_ENTRIES_PER_RESPONSE - 1);
  const entries: Entry[] = raw.map((item) =>
    typeof item === "string" ? (JSON.parse(item) as Entry) : item
  );
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const text =
    typeof body === "object" && body !== null && "text" in body
      ? String((body as { text: unknown }).text ?? "")
      : "";
  const clean = text.trim().slice(0, MAX_LENGTH);
  if (!clean) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  const entry: Entry = {
    id: crypto.randomUUID(),
    text: clean,
    createdAt: new Date().toISOString(),
  };

  const r = getRedis();
  await r.lpush(LIST_KEY, JSON.stringify(entry));
  await r.ltrim(LIST_KEY, 0, MAX_ENTRIES_STORED - 1);

  return NextResponse.json({ entry });
}
