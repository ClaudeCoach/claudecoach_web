import type {
  AiSuggestion,
  DashboardData,
  Locale,
  Pattern,
  ToolStat,
  TurnStat,
} from "@/types";

export type AiMode = "light" | "detailed";

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

function topExpensiveTurns(turns: TurnStat[], n: number): TurnStat[] {
  return turns
    .slice()
    .sort((a, b) => b.cost - a.cost)
    .slice(0, n);
}

function shortClarifications(data: DashboardData, n: number): string[] {
  const out: string[] = [];
  for (const m of data.allMessages) {
    if (m.role !== "user") continue;
    if (m.promptLength === 0 || m.promptLength >= 50) continue;
    if (!m.promptText) continue;
    out.push(m.promptText.slice(0, 80));
    if (out.length >= n) break;
  }
  return out;
}

function topTools(tools: ToolStat[], n: number): ToolStat[] {
  return tools.slice(0, n);
}

function formatTurns(turns: TurnStat[]): string {
  return turns
    .map((t, i) => {
      const text = t.promptText.slice(0, 500).replace(/\s+/g, " ").trim();
      return `${i + 1}. [$${t.cost.toFixed(3)}] [${t.tokens.toLocaleString()} tokens] [${t.projectName}]\n   ${text}`;
    })
    .join("\n");
}

function formatTools(tools: ToolStat[]): string {
  return tools
    .map((t) => `- ${t.name}: ${t.calls} calls, $${t.cost.toFixed(2)}`)
    .join("\n");
}

export class HaikuError extends Error {
  constructor(
    message: string,
    public code: "invalid_key" | "rate_limit" | "network" | "parse"
  ) {
    super(message);
  }
}

function buildPromptLight(data: DashboardData, locale: Locale): string {
  const stats = patternsToStats(data.patterns);
  const sample = data.allMessages
    .filter((m) => m.role === "user" && m.promptText)
    .slice(0, 5)
    .map((m) => m.promptText.slice(0, 100));

  if (locale === "ja") {
    return `あなたは Claude Code のヘビーユーザー向けコーチです。以下の使用統計をもとに、具体的な改善提案をちょうど3件、自然な日本語で作ってください。

# 使用統計
- プロンプトが長すぎる割合（500文字超）: ${(stats.longPromptRatio * 100).toFixed(0)}%
- 短い確認のやりとりが連続する割合: ${(stats.clarificationRatio * 100).toFixed(0)}%
- キャッシュヒット率: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus使用率: ${(stats.opusRatio * 100).toFixed(0)}%
- 平均セッション時間: ${stats.avgSessionMinutes.toFixed(0)}分
- 丁寧表現を含むプロンプトの割合: ${(stats.politeRatio * 100).toFixed(0)}%

# プロンプト例（各先頭100文字）
${sample.map((p, i) => `${i + 1}. ${p}`).join("\n")}

# 出力ルール
- 「澄清」「廃棄ループ」「清算」など中国語寄りの直訳は使わない。自然な日本語で書くこと
- 提案は具体的で実行可能なものにする
- before/after は短い具体例にする
- estimatedSaving は USD 単位の数値（概算でよい）
- 他の説明文は一切出力せず、JSON 配列のみを返す

# スキーマ
[{"title": string, "description": string, "before": string, "after": string, "estimatedSaving": number}]`;
  }

  return `You are a coach for heavy Claude Code users. Based on the statistics below, produce exactly 3 concrete improvement suggestions in natural English.

# Statistics
- Long prompt ratio (>500 chars): ${(stats.longPromptRatio * 100).toFixed(0)}%
- Clarification loop ratio: ${(stats.clarificationRatio * 100).toFixed(0)}%
- Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus usage ratio: ${(stats.opusRatio * 100).toFixed(0)}%
- Avg session duration: ${stats.avgSessionMinutes.toFixed(0)} min
- Polite expression ratio: ${(stats.politeRatio * 100).toFixed(0)}%

# Sample prompts (first 100 chars each)
${sample.map((p, i) => `${i + 1}. ${p}`).join("\n")}

# Rules
- Suggestions must be concrete and actionable
- before/after should be short, realistic examples
- estimatedSaving is a USD number
- Return the JSON array only, no other text

# Schema
[{"title": string, "description": string, "before": string, "after": string, "estimatedSaving": number}]`;
}

function buildPromptDetailed(data: DashboardData, locale: Locale): string {
  const stats = patternsToStats(data.patterns);
  const expensive = topExpensiveTurns(data.turns, 5);
  const tools = topTools(data.toolBreakdown, 8);
  const clarifications = shortClarifications(data, 5);

  if (locale === "ja") {
    return `あなたは Claude Code のヘビーユーザー向けコーチです。以下の詳細な使用データをもとに、**実例を引用しながら** 具体的な改善提案をちょうど3件、自然な日本語で作ってください。

# 使用統計
- プロンプトが長すぎる割合（500文字超）: ${(stats.longPromptRatio * 100).toFixed(0)}%
- 短い確認のやりとりが連続する割合: ${(stats.clarificationRatio * 100).toFixed(0)}%
- キャッシュヒット率: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus使用率: ${(stats.opusRatio * 100).toFixed(0)}%
- 平均セッション時間: ${stats.avgSessionMinutes.toFixed(0)}分
- 丁寧表現を含むプロンプトの割合: ${(stats.politeRatio * 100).toFixed(0)}%
- 合計コスト（期間内）: $${data.totalCost.toFixed(2)}

# ツール別コスト内訳（コスト降順）
${formatTools(tools)}

# 最もコストが高かったターン Top 5
${formatTurns(expensive)}
${
  clarifications.length > 0
    ? `
# 短い確認返信の実例（${clarifications.length}件）
${clarifications.map((c, i) => `${i + 1}. ${c}`).join("\n")}
`
    : ""
}
# 出力ルール
- 「澄清」「廃棄ループ」「清算」など中国語寄りの直訳は使わない
- **必ず上記の実例を引用または言及して**、なぜそれが無駄だったか、どう書くべきかを説明する
- before は実例から、after はあなたの提案する改善版にする
- 提案は具体的で実行可能なものにする
- estimatedSaving は USD 単位の数値（上記の Top 5 ターンと統計から概算）
- 他の説明文は一切出力せず、JSON 配列のみを返す

# スキーマ
[{"title": string, "description": string, "before": string, "after": string, "estimatedSaving": number}]`;
  }

  return `You are a coach for heavy Claude Code users. Based on the detailed usage data below, produce exactly 3 concrete improvement suggestions in natural English. **Quote specific examples from the data.**

# Statistics
- Long prompt ratio (>500 chars): ${(stats.longPromptRatio * 100).toFixed(0)}%
- Clarification loop ratio: ${(stats.clarificationRatio * 100).toFixed(0)}%
- Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus usage ratio: ${(stats.opusRatio * 100).toFixed(0)}%
- Avg session duration: ${stats.avgSessionMinutes.toFixed(0)} min
- Polite expression ratio: ${(stats.politeRatio * 100).toFixed(0)}%
- Total cost (period): $${data.totalCost.toFixed(2)}

# Tool cost breakdown (sorted by cost desc)
${formatTools(tools)}

# Top 5 most expensive turns
${formatTurns(expensive)}
${
  clarifications.length > 0
    ? `
# Short clarification replies (${clarifications.length} samples)
${clarifications.map((c, i) => `${i + 1}. ${c}`).join("\n")}
`
    : ""
}
# Rules
- **You MUST quote or reference the specific examples above**, explain why each was wasteful, and how to rewrite it
- "before" should come from the actual examples; "after" should be your improved version
- Suggestions must be concrete and actionable
- estimatedSaving is a USD number based on the top turns and statistics
- Return the JSON array only, no other text

# Schema
[{"title": string, "description": string, "before": string, "after": string, "estimatedSaving": number}]`;
}

export async function getAiSuggestions(
  data: DashboardData,
  apiKey: string,
  locale: Locale,
  mode: AiMode
): Promise<AiSuggestion[]> {
  if (!apiKey) return [];

  const prompt =
    mode === "detailed"
      ? buildPromptDetailed(data, locale)
      : buildPromptLight(data, locale);

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
        max_tokens: mode === "detailed" ? 2000 : 1200,
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

  let body: { content?: Array<{ text?: string }> };
  try {
    body = await response.json();
  } catch {
    throw new HaikuError("parse", "parse");
  }

  const text = body.content?.[0]?.text ?? "";
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
