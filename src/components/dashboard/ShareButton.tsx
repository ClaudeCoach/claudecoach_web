"use client";

import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { PLAN_LABELS } from "@/lib/pricing";
import type { DashboardData, PlanType } from "@/types";

const SHARE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://claudecoach-web.vercel.app/";

function buildShareText(
  data: DashboardData,
  plan: PlanType,
  t: (key: string, vars?: Record<string, string>) => string
): string {
  const planLabel = PLAN_LABELS[plan];
  const api = data.planROI.apiEquivalent.toFixed(2);
  const cost = data.totalCost.toFixed(2);

  let main: string;
  if (plan === "api") {
    main = t("share_text_api", { cost });
  } else if (data.planROI.isProfitable) {
    const saving = Math.max(
      0,
      data.planROI.apiEquivalent - (data.planROI.planCost ?? 0)
    ).toFixed(2);
    main = t("share_text_profitable", { plan: planLabel, api, saving });
  } else {
    main = t("share_text_unprofitable", { plan: planLabel, api });
  }
  return main + t("share_text_suffix") + SHARE_URL;
}

export function ShareButton({
  data,
  plan,
}: {
  data: DashboardData;
  plan: PlanType;
}) {
  const t = useTranslations("dashboard");

  function onClick() {
    const text = buildShareText(data, plan, t);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={onClick}
      title={t("share")}
      aria-label={t("share")}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
    >
      <Share2 className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{t("share")}</span>
    </button>
  );
}
