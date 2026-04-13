import type {
  DashboardData,
  MessageStat,
  Pattern,
  RuleId,
  RuleSuggestion,
  ToolStat,
} from "@/types";
import { CACHE_READ_PRICE, INPUT_TOKEN_PRICE } from "./pricing";

const PRIORITY: Record<RuleId, "high" | "medium" | "low"> = {
  long_prompt: "high",
  clarification_loop: "high",
  low_cache: "medium",
  opus_overuse: "high",
  long_session: "medium",
  polite_words: "low",
  bash_heavy: "medium",
};

const ORDER: RuleId[] = [
  "opus_overuse",
  "bash_heavy",
  "long_prompt",
  "clarification_loop",
  "low_cache",
  "long_session",
  "polite_words",
];

// Sonnet is roughly 1/5 the price of Opus, so switching saves ~80%.
const OPUS_TO_SONNET_RATIO = 0.8;

// RTK claims 60-90% reduction; use a conservative middle.
const RTK_REDUCTION = 0.7;

// Realistic upper bound for cache hit rate.
const TARGET_CACHE_HIT = 0.8;

function opusSaving(messages: MessageStat[]): number {
  let cost = 0;
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    if (m.model?.toLowerCase().includes("opus")) {
      cost += m.estimatedCost;
    }
  }
  return cost * OPUS_TO_SONNET_RATIO;
}

function lowCacheSaving(messages: MessageStat[], current: number): number {
  if (current >= TARGET_CACHE_HIT) return 0;
  let inputTokens = 0;
  let cacheReadTokens = 0;
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    inputTokens += m.inputTokens;
    cacheReadTokens += m.cacheReadTokens;
  }
  const total = inputTokens + cacheReadTokens;
  if (total === 0) return 0;
  const targetCacheTokens = total * TARGET_CACHE_HIT;
  const extraCacheable = Math.max(0, targetCacheTokens - cacheReadTokens);
  return extraCacheable * (INPUT_TOKEN_PRICE - CACHE_READ_PRICE);
}

function longPromptSaving(
  messages: MessageStat[],
  ratio: number
): number {
  if (ratio === 0) return 0;
  let extraChars = 0;
  for (const m of messages) {
    if (m.role !== "user" || m.promptLength <= 500) continue;
    extraChars += m.promptLength - 200;
  }
  // Rough heuristic: ~4 chars per token.
  const extraTokens = extraChars / 4;
  return extraTokens * INPUT_TOKEN_PRICE;
}

function clarificationSaving(
  data: DashboardData,
  ratio: number
): number {
  // Each wasted clarification round costs roughly the average turn cost.
  if (data.turns.length === 0) return 0;
  const avgTurnCost = data.totalCost / data.turns.length;
  return avgTurnCost * data.turns.length * ratio * 0.3;
}

function bashHeavySaving(tools: ToolStat[]): number {
  const bash = tools.find((t) => t.name === "Bash");
  if (!bash) return 0;
  return bash.cost * RTK_REDUCTION;
}

export function estimateRuleSaving(
  id: RuleId,
  value: number,
  data: DashboardData
): number {
  switch (id) {
    case "opus_overuse":
      return opusSaving(data.allMessages);
    case "low_cache":
      return lowCacheSaving(data.allMessages, value);
    case "long_prompt":
      return longPromptSaving(data.allMessages, value);
    case "clarification_loop":
      return clarificationSaving(data, value);
    case "bash_heavy":
      return bashHeavySaving(data.toolBreakdown);
    case "long_session":
    case "polite_words":
      return 0;
  }
}

export function buildRuleSuggestions(
  patterns: Pattern[],
  data: DashboardData
): RuleSuggestion[] {
  const detected = new Map<string, number>();
  for (const p of patterns) {
    if (p.detected) detected.set(p.id, p.value);
  }
  const out: RuleSuggestion[] = [];
  for (const id of ORDER) {
    if (detected.has(id)) {
      const value = detected.get(id) ?? 0;
      out.push({
        id,
        priority: PRIORITY[id],
        value,
        estimatedSaving: estimateRuleSaving(id, value, data),
      });
    }
  }
  return out;
}

export function totalEstimatedSaving(rules: RuleSuggestion[]): number {
  return rules.reduce((a, r) => a + r.estimatedSaving, 0);
}
