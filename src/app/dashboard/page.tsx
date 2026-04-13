"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TokenChart } from "@/components/dashboard/TokenChart";
import { ProjectTable } from "@/components/dashboard/ProjectTable";
import { MessageList } from "@/components/dashboard/MessageList";
import { ShareButton } from "@/components/dashboard/ShareButton";
import { Suggestions } from "@/components/dashboard/Suggestions";
import { useAnalysis } from "@/lib/analysis-context";
import { useLocale } from "@/lib/i18n-provider";
import { analyzeDashboard, detectPlan } from "@/lib/analyzer";
import { storage } from "@/lib/storage";
import type { PeriodType, PlanType } from "@/types";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { sessions } = useAnalysis();
  const { locale } = useLocale();

  const [plan, setPlan] = useState<PlanType>("pro");
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedPlan = storage.getPlan();
    const savedPeriod = storage.getPeriod();
    const detected = sessions.length > 0 ? detectPlan(sessions) : "pro";
    setPlan(savedPlan ?? detected);
    setPeriod(savedPeriod);
    setHydrated(true);
  }, [sessions]);

  function onPlanChange(p: PlanType) {
    setPlan(p);
    storage.setPlan(p);
  }

  function onPeriodChange(p: PeriodType) {
    setPeriod(p);
    storage.setPeriod(p);
  }

  const data = useMemo(() => {
    if (!hydrated || sessions.length === 0) return null;
    return analyzeDashboard(sessions, period, locale, plan);
  }, [sessions, period, locale, plan, hydrated]);

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center space-y-4">
          <p className="text-muted-foreground">{t("no_data")}</p>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("back_to_top")}
          </Link>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        showControls
        plan={plan}
        onPlanChange={onPlanChange}
        period={period}
        onPeriodChange={onPeriodChange}
        rightSlot={<ShareButton data={data} plan={plan} />}
      />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <SummaryCards data={data} />
        <TokenChart data={data.chartData} />
        <Suggestions data={data} />
        <ProjectTable projects={data.projectBreakdown} />
        <MessageList turns={data.turns} />
      </main>
    </div>
  );
}
