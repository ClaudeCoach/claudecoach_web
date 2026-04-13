import type { AiSuggestion, Locale, Pattern } from "@/types";

type Stats = {
  longPromptRatio: number;
  clarificationRatio: number;
  cacheHitRate: number;
  opusRatio: number;
  avgSessionMinutes: number;
  politeRatio: number;
};

function patternsToStats(patterns: Pattern[]): Stats {
  const get = (id: string) => patterns.find((p) => p.id === id)?.value ?? 0;
  return {
    longPromptRatio: get("long_prompt"),
    clarificationRatio: get("clarification_loop"),
    cacheHitRate: get("low_cache"),
    opusRatio: get("opus_overuse"),
    avgSessionMinutes: get("long_session"),
    politeRatio: get("polite_words"),
  };
}

export class HaikuError extends Error {
  constructor(
    message: string,
    public code: "invalid_key" | "rate_limit" | "network" | "parse"
  ) {
    super(message);
  }
}

export async function getAiSuggestions(
  patterns: Pattern[],
  samplePrompts: string[],
  apiKey: string,
  locale: Locale
): Promise<AiSuggestion[]> {
  if (!apiKey) return [];

  const stats = patternsToStats(patterns);

  const trimmed = samplePrompts
    .filter((p) => p && p.length > 0)
    .slice(0, 5)
    .map((p) => p.slice(0, 100));

  const prompt =
    locale === "ja"
      ? `あなたは Claude Code のヘビーユーザー向けコーチです。以下の使用統計をもとに、具体的な改善提案をちょうど3件、自然な日本語で作ってください。

# 使用統計
- プロンプトが長すぎる割合（500文字超）: ${(stats.longPromptRatio * 100).toFixed(0)}%
- 短い確認のやりとりが連続する割合: ${(stats.clarificationRatio * 100).toFixed(0)}%
- キャッシュヒット率: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus使用率: ${(stats.opusRatio * 100).toFixed(0)}%
- 平均セッション時間: ${stats.avgSessionMinutes.toFixed(0)}分
- 丁寧表現（お願いします等）を含むプロンプトの割合: ${(stats.politeRatio * 100).toFixed(0)}%

# 実際のプロンプト例（各先頭100文字）
${trimmed.map((p, i) => `${i + 1}. ${p}`).join("\n")}

# 出力ルール
- 「澄清」「廃棄ループ」「清算」など中国語寄りの直訳は使わない。自然な日本語で書くこと（例:「確認のやりとり」「確認往復」）
- 提案は具体的で実行可能なものにする
- before/after は実際のプロンプト例を意識した短い具体例にする
- estimatedSaving は USD 単位の数値（概算でよい）
- 他の説明文は一切出力せず、JSON 配列のみを返す

# スキーマ
[{"title": string, "description": string, "before": string, "after": string, "estimatedSaving": number}]`
      : `You are a coach for heavy Claude Code users. Based on the following usage statistics, produce exactly 3 concrete improvement suggestions in natural English.

# Statistics
- Long prompt ratio (>500 chars): ${(stats.longPromptRatio * 100).toFixed(0)}%
- Clarification loop ratio: ${(stats.clarificationRatio * 100).toFixed(0)}%
- Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus usage ratio: ${(stats.opusRatio * 100).toFixed(0)}%
- Avg session duration: ${stats.avgSessionMinutes.toFixed(0)} min
- Polite expression ratio: ${(stats.politeRatio * 100).toFixed(0)}%

# Sample prompts (first 100 chars each)
${trimmed.map((p, i) => `${i + 1}. ${p}`).join("\n")}

# Rules
- Suggestions must be concrete and actionable
- before/after should be short, realistic examples
- estimatedSaving is a USD number (rough estimate is fine)
- Return the JSON array only, no other text

# Schema
[{"title": string, "description": string, "before": string, "after": string, "estimatedSaving": number}]`;

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    throw new HaikuError("network", "network");
  }

  if (!response.ok) {
    if (response.status === 401) throw new HaikuError("invalid_key", "invalid_key");
    if (response.status === 429) throw new HaikuError("rate_limit", "rate_limit");
    throw new HaikuError("network", "network");
  }

  let data: { content?: Array<{ text?: string }> };
  try {
    data = await response.json();
  } catch {
    throw new HaikuError("parse", "parse");
  }

  const text = data.content?.[0]?.text ?? "";
  const clean = text.replace(/```json|```/g, "").trim();
  const match = clean.match(/\[[\s\S]*\]/);
  const jsonText = match ? match[0] : clean;

  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed.slice(0, 3).map((item: Record<string, unknown>) => ({
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
      before: item.before ? String(item.before) : undefined,
      after: item.after ? String(item.after) : undefined,
      estimatedSaving:
        typeof item.estimatedSaving === "number"
          ? item.estimatedSaving
          : undefined,
    }));
  } catch {
    throw new HaikuError("parse", "parse");
  }
}
