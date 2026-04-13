import type { Pattern, RuleId, RuleSuggestion } from "@/types";

const PRIORITY: Record<RuleId, "high" | "medium" | "low"> = {
  long_prompt: "high",
  clarification_loop: "high",
  low_cache: "medium",
  opus_overuse: "high",
  long_session: "medium",
  polite_words: "low",
};

const ORDER: RuleId[] = [
  "opus_overuse",
  "long_prompt",
  "clarification_loop",
  "low_cache",
  "long_session",
  "polite_words",
];

export function buildRuleSuggestions(patterns: Pattern[]): RuleSuggestion[] {
  const detected = new Map<string, number>();
  for (const p of patterns) {
    if (p.detected) detected.set(p.id, p.value);
  }
  const out: RuleSuggestion[] = [];
  for (const id of ORDER) {
    if (detected.has(id)) {
      out.push({
        id,
        priority: PRIORITY[id],
        value: detected.get(id) ?? 0,
      });
    }
  }
  return out;
}
