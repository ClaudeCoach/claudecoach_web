import type {
  ChartData,
  DashboardData,
  MessageStat,
  Pattern,
  PeriodType,
  PlanROI,
  PlanType,
  ProjectData,
  SessionSummary,
  ToolStat,
  TurnStat,
} from "@/types";
import {
  CACHE_READ_PRICE,
  CACHE_WRITE_PRICE,
  INPUT_TOKEN_PRICE,
  OUTPUT_TOKEN_PRICE,
  PLAN_COSTS,
  PLAN_LABELS,
} from "./pricing";

function getMax5hWindowTokens(sessions: SessionSummary[]): number {
  const events: Array<{ ts: number; tokens: number }> = [];
  for (const s of sessions) {
    const t = new Date(s.timestamp).getTime();
    if (isNaN(t)) continue;
    events.push({
      ts: t,
      tokens: s.totalInputTokens + s.totalOutputTokens,
    });
  }
  if (events.length === 0) return 0;

  events.sort((a, b) => a.ts - b.ts);
  const windowMs = 5 * 60 * 60 * 1000;
  let max = 0;
  for (let i = 0; i < events.length; i++) {
    const windowEnd = events[i].ts + windowMs;
    let sum = 0;
    for (let j = i; j < events.length && events[j].ts <= windowEnd; j++) {
      sum += events[j].tokens;
    }
    if (sum > max) max = sum;
  }
  return max;
}

export function detectPlan(sessions: SessionSummary[]): PlanType {
  const cutoff = Date.now() - 8 * 24 * 60 * 60 * 1000;
  const recent = sessions.filter(
    (s) => new Date(s.timestamp).getTime() >= cutoff
  );
  const maxWindow = getMax5hWindowTokens(
    recent.length > 0 ? recent : sessions
  );

  if (maxWindow < 50_000) return "pro";
  if (maxWindow < 100_000) return "max_5x";
  if (maxWindow < 250_000) return "max_20x";
  return "api";
}

export function calcApiEquivalentCost(
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

export function calcROI(
  plan: PlanType,
  apiEquivalent: number,
  locale: "ja" | "en" = "ja"
): PlanROI {
  const cost = PLAN_COSTS[plan];
  if (cost === null) {
    return {
      plan: "api",
      planCost: null,
      apiEquivalent: Math.round(apiEquivalent * 100) / 100,
      roiRatio: null,
      isProfitable: null,
      message:
        locale === "ja"
          ? "APIプランはROI計算対象外"
          : "ROI not applicable for API plan",
    };
  }

  const roi = cost > 0 ? apiEquivalent / cost : 0;
  const isProfitable = roi >= 1.0;
  const label = PLAN_LABELS[plan];

  let message: string;
  if (isProfitable) {
    message =
      locale === "ja"
        ? `${label}プランの${roi.toFixed(1)}倍の元を取っています`
        : `Getting ${roi.toFixed(1)}x return on your ${label} plan`;
  } else {
    const remaining = cost - apiEquivalent;
    message =
      locale === "ja"
        ? `あと$${remaining.toFixed(2)}分使うと元が取れます`
        : `Use $${remaining.toFixed(2)} more to break even`;
  }

  return {
    plan,
    planCost: cost,
    apiEquivalent: Math.round(apiEquivalent * 100) / 100,
    roiRatio: Math.round(roi * 100) / 100,
    isProfitable,
    message,
  };
}

export function buildChartData(
  sessions: SessionSummary[],
  period: PeriodType
): ChartData[] {
  const days = period === "weekly" ? 7 : 30;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const buckets = new Map<string, ChartData>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cost: 0,
    });
  }

  for (const s of sessions) {
    const key = s.date;
    const b = buckets.get(key);
    if (!b) continue;
    b.inputTokens += s.totalInputTokens;
    b.outputTokens += s.totalOutputTokens;
    b.cacheReadTokens += s.totalCacheReadTokens;
    b.cost += s.totalCost;
  }

  return Array.from(buckets.values());
}

export function buildProjectBreakdown(
  sessions: SessionSummary[]
): ProjectData[] {
  const map = new Map<string, ProjectData>();
  for (const s of sessions) {
    const existing = map.get(s.projectName);
    if (existing) {
      existing.cost += s.totalCost;
      existing.inputTokens += s.totalInputTokens;
      existing.outputTokens += s.totalOutputTokens;
      existing.messageCount += s.messageCount;
    } else {
      map.set(s.projectName, {
        projectName: s.projectName,
        cost: s.totalCost,
        inputTokens: s.totalInputTokens,
        outputTokens: s.totalOutputTokens,
        messageCount: s.messageCount,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
}

export function detectPatterns(
  sessions: SessionSummary[],
  allMessages: MessageStat[]
): Pattern[] {
  const userMessages = allMessages.filter((m) => m.role === "user");
  const assistantMessages = allMessages.filter((m) => m.role === "assistant");

  const longPromptRatio =
    userMessages.length > 0
      ? userMessages.filter((m) => m.promptLength > 500).length /
        userMessages.length
      : 0;

  const totalCacheRead = assistantMessages.reduce(
    (a, m) => a + m.cacheReadTokens,
    0
  );
  const totalInput = assistantMessages.reduce((a, m) => a + m.inputTokens, 0);
  const cacheHitRate =
    totalInput + totalCacheRead > 0
      ? totalCacheRead / (totalInput + totalCacheRead)
      : 0;

  const opusCount = assistantMessages.filter((m) =>
    m.model?.toLowerCase().includes("opus")
  ).length;
  const opusRatio =
    assistantMessages.length > 0 ? opusCount / assistantMessages.length : 0;

  const avgSessionMinutes =
    sessions.length > 0
      ? sessions.reduce((a, s) => a + s.durationMinutes, 0) / sessions.length
      : 0;

  const politeWords = [
    "よろしくお願いします",
    "お願いします",
    "ありがとうございます",
    "please",
    "thank you",
  ];
  const politeCount = userMessages.filter((m) =>
    politeWords.some((w) => m.promptText.toLowerCase().includes(w.toLowerCase()))
  ).length;
  const politeRatio =
    userMessages.length > 0 ? politeCount / userMessages.length : 0;

  let shortReplyRuns = 0;
  let currentRun = 0;
  for (const m of userMessages) {
    if (m.promptLength < 50) {
      currentRun++;
      if (currentRun >= 3) {
        shortReplyRuns++;
        currentRun = 0;
      }
    } else {
      currentRun = 0;
    }
  }
  const clarificationRatio =
    userMessages.length > 0
      ? (shortReplyRuns * 3) / userMessages.length
      : 0;

  const tools = buildToolBreakdown(allMessages);
  const totalToolCost = tools.reduce((a, t) => a + t.cost, 0);
  const bash = tools.find((t) => t.name === "Bash");
  const bashShare =
    totalToolCost > 0 && bash ? bash.cost / totalToolCost : 0;
  const bashHeavy = !!bash && bash.calls >= 10 && bashShare > 0.25;

  return [
    { id: "long_prompt", detected: longPromptRatio > 0.2, value: longPromptRatio },
    { id: "low_cache", detected: cacheHitRate < 0.5, value: cacheHitRate },
    { id: "opus_overuse", detected: opusRatio > 0.7, value: opusRatio },
    {
      id: "long_session",
      detected: avgSessionMinutes > 120,
      value: avgSessionMinutes,
    },
    { id: "polite_words", detected: politeRatio > 0.1, value: politeRatio },
    {
      id: "clarification_loop",
      detected: clarificationRatio > 0.2,
      value: clarificationRatio,
    },
    { id: "bash_heavy", detected: bashHeavy, value: bashShare },
  ];
}

export function buildToolBreakdown(messages: MessageStat[]): ToolStat[] {
  const map = new Map<string, ToolStat>();
  for (const m of messages) {
    if (m.role !== "assistant" || m.toolCalls.length === 0) continue;
    const perCall = m.estimatedCost / m.toolCalls.length;
    for (const name of m.toolCalls) {
      const existing = map.get(name);
      if (existing) {
        existing.calls += 1;
        existing.cost += perCall;
      } else {
        map.set(name, { name, calls: 1, cost: perCall });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
}

export function buildTurns(sessions: SessionSummary[]): TurnStat[] {
  const turns: TurnStat[] = [];
  for (const session of sessions) {
    let current: TurnStat | null = null;
    for (const m of session.messages) {
      if (m.role === "user" && m.promptText) {
        if (current) turns.push(current);
        current = {
          timestamp: m.timestamp,
          projectName: session.projectName,
          promptText: m.promptText,
          promptLength: m.promptLength,
          tokens: 0,
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          inputCost: 0,
          outputCost: 0,
          cacheReadCost: 0,
          cacheCreationCost: 0,
        };
      } else if (m.role === "assistant" && current) {
        current.tokens +=
          m.inputTokens + m.outputTokens + m.cacheReadTokens;
        current.cost += m.estimatedCost;
        current.inputTokens += m.inputTokens;
        current.outputTokens += m.outputTokens;
        current.cacheReadTokens += m.cacheReadTokens;
        current.cacheCreationTokens += m.cacheCreationTokens;
        current.inputCost += m.inputTokens * INPUT_TOKEN_PRICE;
        current.outputCost += m.outputTokens * OUTPUT_TOKEN_PRICE;
        current.cacheReadCost += m.cacheReadTokens * CACHE_READ_PRICE;
        current.cacheCreationCost += m.cacheCreationTokens * CACHE_WRITE_PRICE;
      }
    }
    if (current) turns.push(current);
  }
  return turns;
}

export function analyzeDashboard(
  sessions: SessionSummary[],
  period: PeriodType,
  locale: "ja" | "en",
  manualPlan?: PlanType
): DashboardData {
  const detectedPlan = manualPlan ?? detectPlan(sessions);

  // Period filter for all display metrics
  const periodDays = period === "weekly" ? 7 : 30;
  const periodCutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
  const periodSessions = sessions.filter(
    (s) => new Date(s.timestamp).getTime() >= periodCutoff
  );

  const periodMessages = periodSessions.flatMap((s) => s.messages);
  const turns = buildTurns(periodSessions);

  const totalInputTokens = periodSessions.reduce(
    (a, s) => a + s.totalInputTokens,
    0
  );
  const totalOutputTokens = periodSessions.reduce(
    (a, s) => a + s.totalOutputTokens,
    0
  );
  const totalCacheReadTokens = periodSessions.reduce(
    (a, s) => a + s.totalCacheReadTokens,
    0
  );
  const totalCost = periodSessions.reduce((a, s) => a + s.totalCost, 0);

  // ROI always uses last 30 days (billing cycle)
  const billingCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const billing = sessions.filter(
    (s) => new Date(s.timestamp).getTime() >= billingCutoff
  );
  const billingInput = billing.reduce((a, s) => a + s.totalInputTokens, 0);
  const billingOutput = billing.reduce((a, s) => a + s.totalOutputTokens, 0);
  const billingCacheRead = billing.reduce(
    (a, s) => a + s.totalCacheReadTokens,
    0
  );
  const billingCacheCreate = billing.reduce(
    (a, s) => a + s.totalCacheCreationTokens,
    0
  );
  const apiEquivalent = calcApiEquivalentCost(
    billingInput,
    billingOutput,
    billingCacheRead,
    billingCacheCreate
  );
  const planROI = calcROI(detectedPlan, apiEquivalent, locale);

  return {
    sessions: periodSessions,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCost,
    detectedPlan,
    planROI,
    chartData: buildChartData(periodSessions, period),
    projectBreakdown: buildProjectBreakdown(periodSessions),
    patterns: detectPatterns(periodSessions, periodMessages),
    allMessages: periodMessages,
    turns,
    toolBreakdown: buildToolBreakdown(periodMessages),
  };
}

export function avgTokensPerClarification(data: DashboardData): number {
  const clarifications = data.allMessages.filter(
    (m) => m.role === "user" && m.promptLength < 50 && m.promptLength > 0,
  );
  if (clarifications.length === 0) return 0;
  const totalTokens = clarifications.reduce((sum, m) => sum + m.inputTokens, 0);
  return Math.round(totalTokens / clarifications.length);
}

export function worstPrompts(
  data: DashboardData,
  n = 3,
): Array<{ text: string; cost: number; tokens: number }> {
  return data.allMessages
    .filter((m) => m.role === "user" && m.promptText)
    .sort((a, b) => b.estimatedCost - a.estimatedCost)
    .slice(0, n)
    .map((m) => ({
      text: m.promptText.slice(0, 200),
      cost: m.estimatedCost,
      tokens: m.inputTokens,
    }));
}

export function patternWasteCosts(
  data: DashboardData,
): Record<string, number> {
  const get = (id: string) =>
    data.patterns.find((p) => p.id === id)?.value ?? 0;
  return {
    clarification: data.totalCost * get("clarification_loop"),
    longPrompt: data.totalCost * get("long_prompt") * 0.1,
    opus: data.totalCost * get("opus_overuse") * 0.4,
    polite: data.totalCost * get("polite_words") * 0.02,
    longSession: data.totalCost * get("long_session") * 0.35,
    lowCache: data.totalCost * get("low_cache") * 0.25,
  };
}
