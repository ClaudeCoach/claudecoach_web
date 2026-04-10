"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/types";
import { useLocale } from "@/lib/i18n-provider";
import { cn } from "@/lib/utils";

function formatTokens(n: number, locale: "ja" | "en"): string {
  if (locale === "ja") {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(0)}万`;
    return n.toLocaleString();
  }
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        highlight && "border-primary/40 bg-primary/5"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={cn(
            "text-xs font-semibold uppercase tracking-widest",
            highlight ? "text-primary" : "text-muted-foreground"
          )}
        >
          <span className="mr-1">{"//"}</span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-4xl font-bold tabular-nums tracking-tight",
            highlight ? "text-primary" : "text-foreground"
          )}
        >
          {value}
        </p>
        {sub && (
          <p
            className={cn(
              "mt-1.5 text-sm",
              highlight ? "text-primary/70" : "text-muted-foreground"
            )}
          >
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ data }: { data: DashboardData }) {
  const t = useTranslations("dashboard");
  const { locale } = useLocale();
  const totalTokens = data.totalInputTokens + data.totalOutputTokens;
  const savings = data.planROI.apiEquivalent * 0.4;

  const roi = data.planROI;
  const roiValue =
    roi.roiRatio != null ? `${roi.roiRatio.toFixed(1)}x` : "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label={t("total_tokens")}
        value={formatTokens(totalTokens, locale)}
        sub={`sessions=${data.sessions.length}`}
      />
      <StatCard
        label={t("api_cost")}
        value={`$${roi.apiEquivalent.toFixed(2)}`}
        sub={`msgs=${data.turns.length}`}
      />
      <StatCard
        label={t("roi")}
        value={`${roiValue}${
          roi.isProfitable === true ? " ✓" : roi.isProfitable === false ? " ✗" : ""
        }`}
        sub={roi.message}
        highlight={roi.isProfitable === true}
      />
      <StatCard label={t("saving")} value={`$${savings.toFixed(2)}`} />
    </div>
  );
}
