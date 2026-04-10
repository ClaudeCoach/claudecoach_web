import type { PlanType } from "@/types";

export const PLAN_COSTS: Record<PlanType, number | null> = {
  pro: 20.0,
  max_5x: 100.0,
  max_20x: 200.0,
  api: null,
};

export const INPUT_TOKEN_PRICE = 0.000003;
export const OUTPUT_TOKEN_PRICE = 0.000015;
export const CACHE_READ_PRICE = 0.0000003;
export const CACHE_WRITE_PRICE = 0.00000375;

export const PLAN_LABELS: Record<PlanType, string> = {
  pro: "Pro",
  max_5x: "Max 5x",
  max_20x: "Max 20x",
  api: "API",
};
