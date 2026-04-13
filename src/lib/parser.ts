import type {
  JsonlEntry,
  MessageStat,
  SessionSummary,
} from "@/types";
import {
  INPUT_TOKEN_PRICE,
  OUTPUT_TOKEN_PRICE,
  CACHE_READ_PRICE,
  CACHE_WRITE_PRICE,
} from "./pricing";

export function extractProjectName(dirName: string): string {
  let name = dirName;
  if (name.startsWith("-")) name = name.slice(1);

  // Strip drive-letter prefix: "C--" / "c--"
  name = name.replace(/^[a-zA-Z]--/, "");

  // Strip home-dir prefixes: "Users-<name>-" / "home-<name>-"
  name = name.replace(/^Users-[^-]+-/, "");
  name = name.replace(/^home-[^-]+-/, "");

  // Strip language bucket prefixes
  for (const prefix of ["python-", "node-", "go-", "src-"]) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
      break;
    }
  }

  return name || dirName;
}

function costOf(
  input: number,
  output: number,
  cacheRead: number,
  cacheCreate: number
): number {
  return (
    input * INPUT_TOKEN_PRICE +
    output * OUTPUT_TOKEN_PRICE +
    cacheRead * CACHE_READ_PRICE +
    cacheCreate * CACHE_WRITE_PRICE
  );
}

export function parseJsonlContent(
  content: string,
  sessionId: string,
  projectName: string
): SessionSummary | null {
  const messages: MessageStat[] = [];
  const timestamps: Date[] = [];
  const modelsSeen: string[] = [];

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    let entry: JsonlEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.isSidechain === true) continue;
    if (entry.isApiErrorMessage === true) continue;

    const ts = entry.timestamp ? new Date(entry.timestamp) : null;
    if (ts && !isNaN(ts.getTime())) timestamps.push(ts);

    const message = entry.message;
    if (!message) continue;

    let promptText = "";
    let promptLength = 0;
    const toolCalls: string[] = [];

    if (message.content) {
      for (const block of message.content) {
        if (block.type === "text" && block.text) {
          if (!promptText) promptText = block.text.slice(0, 4000);
          promptLength += block.text.length;
        } else if (block.type === "tool_use" && block.name) {
          toolCalls.push(block.name);
        }
      }
    }

    const usage = message.usage;
    const inputTokens = usage?.input_tokens ?? 0;
    const outputTokens = usage?.output_tokens ?? 0;
    const cacheReadTokens = usage?.cache_read_input_tokens ?? 0;
    const cacheCreationTokens = usage?.cache_creation_input_tokens ?? 0;

    // user messages typically have no usage; include them for prompt stats
    // assistant messages carry usage; include for token stats
    if (message.role === "assistant" && message.model) {
      modelsSeen.push(message.model);
    }

    if (
      !usage &&
      message.role !== "user"
    ) {
      continue;
    }

    messages.push({
      timestamp: entry.timestamp ?? "",
      role: message.role,
      promptText,
      promptLength,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheCreationTokens,
      model: message.model,
      toolCalls,
      estimatedCost: costOf(
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheCreationTokens
      ),
    });
  }

  if (timestamps.length === 0) return null;

  timestamps.sort((a, b) => a.getTime() - b.getTime());
  const first = timestamps[0];
  const last = timestamps[timestamps.length - 1];
  const durationMinutes = (last.getTime() - first.getTime()) / 60000;

  const totalInputTokens = messages.reduce((a, m) => a + m.inputTokens, 0);
  const totalOutputTokens = messages.reduce((a, m) => a + m.outputTokens, 0);
  const totalCacheReadTokens = messages.reduce(
    (a, m) => a + m.cacheReadTokens,
    0
  );
  const totalCacheCreationTokens = messages.reduce(
    (a, m) => a + m.cacheCreationTokens,
    0
  );
  const totalCost = messages.reduce((a, m) => a + m.estimatedCost, 0);

  const modelCounts: Record<string, number> = {};
  for (const m of modelsSeen) {
    modelCounts[m] = (modelCounts[m] ?? 0) + 1;
  }
  let topModel = "";
  let topCount = 0;
  for (const m of Object.keys(modelCounts)) {
    if (modelCounts[m] > topCount) {
      topModel = m;
      topCount = modelCounts[m];
    }
  }

  return {
    sessionId,
    projectName,
    date: first.toISOString().slice(0, 10),
    timestamp: first.toISOString(),
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCacheCreationTokens,
    totalCost,
    messageCount: messages.filter((m) => m.role === "user").length,
    durationMinutes: Math.round(durationMinutes * 10) / 10,
    model: topModel,
    messages,
  };
}

export type DroppedFile = {
  path: string;
  content: string;
};

export async function parseDroppedFiles(
  files: DroppedFile[]
): Promise<SessionSummary[]> {
  const sessions: SessionSummary[] = [];

  for (const file of files) {
    if (!file.path.endsWith(".jsonl")) continue;

    const parts = file.path.split(/[\\/]/);
    const fileName = parts[parts.length - 1];
    const sessionId = fileName.replace(/\.jsonl$/, "");

    let projectDir = "";
    for (let i = parts.length - 2; i >= 0; i--) {
      if (parts[i]) {
        projectDir = parts[i];
        break;
      }
    }
    const projectName = extractProjectName(projectDir);

    const summary = parseJsonlContent(file.content, sessionId, projectName);
    if (summary) sessions.push(summary);
  }

  return sessions;
}
