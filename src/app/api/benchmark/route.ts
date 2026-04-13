import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (_redis) return _redis;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Redis env vars not set (KV_REST_API_URL / KV_REST_API_TOKEN)");
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const HASH_KEY = "benchmark:v1";
const FIELDS = [
  "long_prompt",
  "clarification",
  "cache_hit",
  "opus",
  "session_min",
  "polite",
  "cost",
] as const;
type Field = (typeof FIELDS)[number];

type Submission = Record<Field, number>;

function parseSubmission(body: unknown): Submission | null {
  if (typeof body !== "object" || body === null) return null;
  const obj = body as Record<string, unknown>;
  const out = {} as Submission;
  for (const f of FIELDS) {
    const v = obj[f];
    if (typeof v !== "number" || !isFinite(v)) return null;
    if (f === "session_min") {
      if (v < 0 || v > 24 * 60) return null;
    } else if (f === "cost") {
      if (v < 0 || v > 100000) return null;
    } else {
      if (v < 0 || v > 1) return null;
    }
    out[f] = v;
  }
  return out;
}

function applyDelta(
  current: Submission,
  previous: Submission | null
): Submission {
  if (!previous) return current;
  const out = {} as Submission;
  for (const f of FIELDS) {
    out[f] = current[f] - previous[f];
  }
  return out;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const obj = body as { current?: unknown; previous?: unknown } | null;
  const current = parseSubmission(obj?.current);
  if (!current) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const previous = parseSubmission(obj?.previous);

  const r = getRedis();
  const delta = applyDelta(current, previous);

  const ops: Promise<unknown>[] = [];
  for (const f of FIELDS) {
    ops.push(r.hincrbyfloat(HASH_KEY, `sum_${f}`, delta[f]));
  }
  if (!previous) {
    ops.push(r.hincrby(HASH_KEY, "count", 1));
  }
  await Promise.all(ops);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const r = getRedis();
  const raw = await r.hgetall<Record<string, string>>(HASH_KEY);
  if (!raw || !raw.count) {
    return NextResponse.json({ count: 0, averages: null });
  }
  const count = Number(raw.count);
  if (count <= 0) {
    return NextResponse.json({ count: 0, averages: null });
  }
  const averages = {} as Record<Field, number>;
  for (const f of FIELDS) {
    const sum = Number(raw[`sum_${f}`] ?? 0);
    averages[f] = sum / count;
  }
  return NextResponse.json({ count, averages });
}
