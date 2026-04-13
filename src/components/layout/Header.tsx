"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { LangToggle } from "./LangToggle";
import { PlanToggle } from "./PlanToggle";
import { PeriodToggle } from "./PeriodToggle";
import type { PeriodType, PlanType } from "@/types";

type HeaderProps = {
  showControls?: boolean;
  plan?: PlanType;
  onPlanChange?: (plan: PlanType) => void;
  period?: PeriodType;
  onPeriodChange?: (period: PeriodType) => void;
  rightSlot?: React.ReactNode;
};

export function Header({
  showControls = false,
  plan,
  onPlanChange,
  period,
  onPeriodChange,
  rightSlot,
}: HeaderProps) {
  const tf = useTranslations("feedback");
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <Zap
            className="h-5 w-5 text-primary group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all"
            strokeWidth={2.5}
          />
          <span className="text-xl font-bold tracking-tight lowercase">
            claudecoach
          </span>
          <span className="text-xs text-muted-foreground ml-0.5">v1.0</span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/feedback"
            className="text-xs font-semibold lowercase text-muted-foreground hover:text-primary transition-colors"
          >
            {"// "}
            {tf("nav_link")}
          </Link>
          {showControls && plan && onPlanChange && (
            <PlanToggle current={plan} onChange={onPlanChange} />
          )}
          {showControls && period && onPeriodChange && (
            <PeriodToggle current={period} onChange={onPeriodChange} />
          )}
          {rightSlot}
          <LangToggle />
        </div>
      </div>
    </header>
  );
}
