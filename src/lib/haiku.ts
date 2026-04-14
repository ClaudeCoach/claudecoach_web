import type {
  AiSuggestion,
  DashboardData,
  Locale,
  Pattern,
  ToolStat,
  TurnStat,
} from "@/types";
import {
  avgTokensPerClarification,
  patternWasteCosts,
  worstPrompts,
} from "./analyzer";

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

function formatTurns(turns: TurnStat[], totalCost: number): string {
  return turns
    .map((t, i) => {
      const text = t.promptText.slice(0, 500).replace(/\s+/g, " ").trim();
      const pct = totalCost > 0 ? ((t.cost / totalCost) * 100).toFixed(0) : "0";
      return `${i + 1}. [$${t.cost.toFixed(3)}] [${t.tokens.toLocaleString()} tokens] [${pct}% of total] [${t.projectName}]\n   ${text}`;
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

  const wasteCosts = {
    clarification: (data.totalCost * stats.clarificationRatio).toFixed(2),
    longPrompt: (data.totalCost * stats.longPromptRatio * 0.1).toFixed(2),
    opus: (data.totalCost * stats.opusRatio * 0.4).toFixed(2),
  };

  if (locale === "ja") {
    return `あなたは Claude Code のヘビーユーザー向けコーチです。以下の使用統計をもとに、具体的な改善提案をちょうど3件、自然な日本語で作ってください。

# 使用統計
- 期間内の合計コスト: $${data.totalCost.toFixed(2)}
- 合計トークン数: ${(data.totalInputTokens + data.totalOutputTokens + data.totalCacheReadTokens).toLocaleString()}
- プロンプトが長すぎる割合（500文字超）: ${(stats.longPromptRatio * 100).toFixed(0)}%
- 短い確認のやりとりが連続する割合: ${(stats.clarificationRatio * 100).toFixed(0)}%
- キャッシュヒット率: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus使用率: ${(stats.opusRatio * 100).toFixed(0)}%
- 平均セッション時間: ${stats.avgSessionMinutes.toFixed(0)}分
- 丁寧表現を含むプロンプトの割合: ${(stats.politeRatio * 100).toFixed(0)}%

# コスト内訳（概算・このユーザー固有）
- 確認往復による無駄: $${wasteCosts.clarification}（月間コストの${(stats.clarificationRatio * 100).toFixed(0)}%）
- 長いプロンプトによる無駄: $${wasteCosts.longPrompt}
- Opus多用による無駄: $${wasteCosts.opus}

# プロンプト例（各先頭100文字）
${sample.map((p, i) => `${i + 1}. ${p}`).join("\n")}

# 出力ルール
- 「澄清」「廃棄ループ」「清算」など中国語寄りの直訳は使わない。自然な日本語で書くこと
- description には必ず「あなたの場合は月$XX（約XX万トークン、月間使用量のXX%）節約できます」の形で具体的な金額・トークン数・割合を含めること（上記コスト内訳から計算）
- before は上記のプロンプト例から抜粋すること。「[エラーメッセージをペースト]」のようなプレースホルダーは禁止
- after は before を実際に改善した具体的な文章にする（テンプレートは禁止）
- estimatedSaving は USD 単位の数値（合計コスト$${data.totalCost.toFixed(2)}から計算した具体値）
- 他の説明文は一切出力せず、JSON 配列のみを返す

# スキーマ
[{"title": string, "description": string, "before": string, "after": string, "estimatedSaving": number}]`;
  }

  return `You are a coach for heavy Claude Code users. Based on the statistics below, produce exactly 3 concrete improvement suggestions in natural English.

# Statistics
- Total cost (period): $${data.totalCost.toFixed(2)}
- Total tokens: ${(data.totalInputTokens + data.totalOutputTokens + data.totalCacheReadTokens).toLocaleString()}
- Long prompt ratio (>500 chars): ${(stats.longPromptRatio * 100).toFixed(0)}%
- Clarification loop ratio: ${(stats.clarificationRatio * 100).toFixed(0)}%
- Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus usage ratio: ${(stats.opusRatio * 100).toFixed(0)}%
- Avg session duration: ${stats.avgSessionMinutes.toFixed(0)} min
- Polite expression ratio: ${(stats.politeRatio * 100).toFixed(0)}%

# Cost breakdown (estimated, specific to this user)
- Waste from clarification loops: $${wasteCosts.clarification} (${(stats.clarificationRatio * 100).toFixed(0)}% of total cost)
- Waste from long prompts: $${wasteCosts.longPrompt}
- Waste from Opus overuse: $${wasteCosts.opus}

# Sample prompts (first 100 chars each)
${sample.map((p, i) => `${i + 1}. ${p}`).join("\n")}

# Rules
- Every description MUST include a concrete number in the form "In your case you could save $XX/month (about XX tokens, XX% of monthly usage)" derived from the cost breakdown above
- "before" MUST be drawn from the sample prompts above. No placeholders like "[paste error message here]"
- "after" must be a concrete rewrite of that specific "before" — not a generic template
- estimatedSaving is a USD number computed from the total cost $${data.totalCost.toFixed(2)}
- Return the JSON array only, no other text

# Schema
[{"title": string, "description": string, "before": string, "after": string, "estimatedSaving": number}]`;
}

function buildPromptDetailed(data: DashboardData, locale: Locale): string {
  const stats = patternsToStats(data.patterns);
  const expensive = topExpensiveTurns(data.turns, 5);
  const tools = topTools(data.toolBreakdown, 8);
  const clarifications = shortClarifications(data, 5);
  const totalTokens =
    data.totalInputTokens + data.totalOutputTokens + data.totalCacheReadTokens;

  const avgClarTokens = avgTokensPerClarification(data);
  const worst = worstPrompts(data, 3);
  const waste = patternWasteCosts(data);

  const clarificationTotalCost = data.totalCost * stats.clarificationRatio;
  const clarificationTotalTokens = Math.round(
    totalTokens * stats.clarificationRatio,
  );
  const clarificationBlock =
    stats.clarificationRatio >= 0.3
      ? locale === "ja"
        ? `
# 確認往復の累計コスト（このユーザー固有）
- 確認往復の合計コスト: $${clarificationTotalCost.toFixed(2)}（月間コストの${(stats.clarificationRatio * 100).toFixed(0)}%）
- 確認往復の合計トークン: 約${clarificationTotalTokens.toLocaleString()}
- 確認往復1回あたりの平均入力トークン: ${avgClarTokens.toLocaleString()}
`
        : `
# Clarification loop cumulative cost (specific to this user)
- Total clarification cost: $${clarificationTotalCost.toFixed(2)} (${(stats.clarificationRatio * 100).toFixed(0)}% of monthly cost)
- Total clarification tokens: ~${clarificationTotalTokens.toLocaleString()}
- Avg input tokens per clarification turn: ${avgClarTokens.toLocaleString()}
`
      : "";

  const worstBlock =
    worst.length > 0
      ? locale === "ja"
        ? `
# ワーストプロンプト Top ${worst.length}（単発コスト降順・各200文字まで）
${worst.map((w, i) => `${i + 1}. [$${w.cost.toFixed(3)}] [${w.tokens.toLocaleString()} input tokens]\n   ${w.text.replace(/\s+/g, " ").trim()}`).join("\n")}
`
        : `
# Worst prompts Top ${worst.length} (by per-turn cost, up to 200 chars each)
${worst.map((w, i) => `${i + 1}. [$${w.cost.toFixed(3)}] [${w.tokens.toLocaleString()} input tokens]\n   ${w.text.replace(/\s+/g, " ").trim()}`).join("\n")}
`
      : "";

  const wasteBlock =
    locale === "ja"
      ? `
# パターン別の無駄コスト内訳（このユーザー固有・USD換算）
- 確認往復: $${waste.clarification.toFixed(2)}
- 長すぎるプロンプト: $${waste.longPrompt.toFixed(2)}
- Opus多用: $${waste.opus.toFixed(2)}
- 丁寧表現: $${waste.polite.toFixed(2)}
- 長すぎるセッション: $${waste.longSession.toFixed(2)}
- キャッシュ未活用: $${waste.lowCache.toFixed(2)}
`
      : `
# Waste cost breakdown by pattern (specific to this user, USD)
- Clarification loops: $${waste.clarification.toFixed(2)}
- Long prompts: $${waste.longPrompt.toFixed(2)}
- Opus overuse: $${waste.opus.toFixed(2)}
- Polite filler: $${waste.polite.toFixed(2)}
- Long sessions: $${waste.longSession.toFixed(2)}
- Low cache hit: $${waste.lowCache.toFixed(2)}
`;

  if (locale === "ja") {
    return `あなたは Claude Code のヘビーユーザー向けコーチです。以下の詳細な使用データをもとに、**実例を引用しながら** 具体的な改善提案をちょうど3件、自然な日本語で作ってください。

# 使用統計
- 期間内の合計コスト: $${data.totalCost.toFixed(2)}
- 合計トークン数: ${totalTokens.toLocaleString()}
- プロンプトが長すぎる割合（500文字超）: ${(stats.longPromptRatio * 100).toFixed(0)}%
- 短い確認のやりとりが連続する割合: ${(stats.clarificationRatio * 100).toFixed(0)}%
- キャッシュヒット率: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus使用率: ${(stats.opusRatio * 100).toFixed(0)}%
- 平均セッション時間: ${stats.avgSessionMinutes.toFixed(0)}分
- 丁寧表現を含むプロンプトの割合: ${(stats.politeRatio * 100).toFixed(0)}%
${clarificationBlock}${wasteBlock}${worstBlock}
# ツール別コスト内訳（コスト降順）
${formatTools(tools)}

# 最もコストが高かったターン Top 5（各ターンが月間コストの何%かも付記）
${formatTurns(expensive, data.totalCost)}
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
- description には必ず「あなたの場合は月$XX（約XX万トークン、月間使用量のXX%）節約できます」の形で具体的な金額・トークン数・割合を含めること
- before は上記の「最もコストが高かったターン」または「短い確認返信の実例」から抜粋すること。「[エラーメッセージをペースト]」のようなプレースホルダーは禁止
- after は before を実際に改善した具体的な文章にする（テンプレートではなく実際の文章）
- estimatedSaving は USD 単位の数値（合計コスト$${data.totalCost.toFixed(2)}と上記の Top 5 ターンから計算した具体値）
- 他の説明文は一切出力せず、JSON 配列のみを返す

# スキーマ
[{"title": string, "description": string, "before": string, "after": string, "estimatedSaving": number}]`;
  }

  return `You are a coach for heavy Claude Code users. Based on the detailed usage data below, produce exactly 3 concrete improvement suggestions in natural English. **Quote specific examples from the data.**

# Statistics
- Total cost (period): $${data.totalCost.toFixed(2)}
- Total tokens: ${totalTokens.toLocaleString()}
- Long prompt ratio (>500 chars): ${(stats.longPromptRatio * 100).toFixed(0)}%
- Clarification loop ratio: ${(stats.clarificationRatio * 100).toFixed(0)}%
- Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(0)}%
- Opus usage ratio: ${(stats.opusRatio * 100).toFixed(0)}%
- Avg session duration: ${stats.avgSessionMinutes.toFixed(0)} min
- Polite expression ratio: ${(stats.politeRatio * 100).toFixed(0)}%
${clarificationBlock}${wasteBlock}${worstBlock}
# Tool cost breakdown (sorted by cost desc)
${formatTools(tools)}

# Top 5 most expensive turns (each annotated with % of monthly cost)
${formatTurns(expensive, data.totalCost)}
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
- Every description MUST include a concrete number in the form "In your case you could save $XX/month (about XX tokens, XX% of monthly usage)"
- "before" MUST be drawn from the Top 5 expensive turns or the short clarification samples above. No placeholders like "[paste error message here]"
- "after" must be a concrete rewrite of that specific "before" — not a generic template
- estimatedSaving is a USD number computed from the total cost $${data.totalCost.toFixed(2)} and the Top 5 turns
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
