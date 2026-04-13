import type { Locale, PeriodType, PlanType } from "@/types";
import type { AiMode } from "./haiku";

const KEYS = {
  API_KEY: "claudecoach_api_key",
  LOCALE: "claudecoach_locale",
  PLAN: "claudecoach_plan",
  PERIOD: "claudecoach_period",
  AI_MODE: "claudecoach_ai_mode",
  BENCHMARK_OPTIN: "claudecoach_benchmark_optin",
  BENCHMARK_LAST: "claudecoach_benchmark_last",
} as const;

export type BenchmarkSnapshot = {
  long_prompt: number;
  clarification: number;
  cache_hit: number;
  opus: number;
  session_min: number;
  polite: number;
  cost: number;
};

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const storage = {
  getApiKey: (): string => safeGet(KEYS.API_KEY) ?? "",
  setApiKey: (key: string) => safeSet(KEYS.API_KEY, key),
  clearApiKey: () => safeRemove(KEYS.API_KEY),

  getLocale: (): Locale => (safeGet(KEYS.LOCALE) as Locale) ?? "ja",
  setLocale: (locale: Locale) => safeSet(KEYS.LOCALE, locale),

  getPlan: (): PlanType | null => safeGet(KEYS.PLAN) as PlanType | null,
  setPlan: (plan: PlanType) => safeSet(KEYS.PLAN, plan),
  clearPlan: () => safeRemove(KEYS.PLAN),

  getPeriod: (): PeriodType =>
    (safeGet(KEYS.PERIOD) as PeriodType) ?? "weekly",
  setPeriod: (period: PeriodType) => safeSet(KEYS.PERIOD, period),

  getAiMode: (): AiMode => (safeGet(KEYS.AI_MODE) as AiMode) ?? "light",
  setAiMode: (mode: AiMode) => safeSet(KEYS.AI_MODE, mode),

  getBenchmarkOptin: (): boolean =>
    safeGet(KEYS.BENCHMARK_OPTIN) === "1",
  setBenchmarkOptin: (v: boolean) =>
    v ? safeSet(KEYS.BENCHMARK_OPTIN, "1") : safeRemove(KEYS.BENCHMARK_OPTIN),

  getBenchmarkLast: (): BenchmarkSnapshot | null => {
    const raw = safeGet(KEYS.BENCHMARK_LAST);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as BenchmarkSnapshot;
    } catch {
      return null;
    }
  },
  setBenchmarkLast: (snap: BenchmarkSnapshot) =>
    safeSet(KEYS.BENCHMARK_LAST, JSON.stringify(snap)),
};
