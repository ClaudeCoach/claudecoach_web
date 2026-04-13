import type { Locale, PeriodType, PlanType } from "@/types";
import type { AiMode } from "./haiku";

const KEYS = {
  API_KEY: "claudecoach_api_key",
  LOCALE: "claudecoach_locale",
  PLAN: "claudecoach_plan",
  PERIOD: "claudecoach_period",
  AI_MODE: "claudecoach_ai_mode",
} as const;

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
};
