import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/*
 * Local feedback store — writes to ./data/feedback.json on the filesystem.
 * Works for `next dev` on the developer's machine.
 *
 * NOTE: Vercel serverless has a read-only filesystem. Before deploying,
 * swap this for Vercel KV / Upstash Redis / Supabase:
 *
 *   import { kv } from "@vercel/kv";
 *   const entries = (await kv.get<Entry[]>("feedback")) ?? [];
 *   await kv.set("feedback", [...entries, newEntry]);
 */

export const dynamic = "force-dynamic";

type Entry = {
  id: string;
  text: string;
  createdAt: string;
};

const DATA_FILE = path.join(process.cwd(), "data", "feedback.json");
const MAX_LENGTH = 2000;
const MAX_ENTRIES_PER_RESPONSE = 500;

async function readAll(): Promise<Entry[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(entries: Entry[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function GET() {
  const entries = await readAll();
  const sorted = entries
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, MAX_ENTRIES_PER_RESPONSE);
  return NextResponse.json({ entries: sorted });
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

  const entries = await readAll();
  entries.push(entry);
  await writeAll(entries);

  return NextResponse.json({ entry });
}
