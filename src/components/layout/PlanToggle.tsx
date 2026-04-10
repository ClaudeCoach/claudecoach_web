"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { PlanType } from "@/types";
import { cn } from "@/lib/utils";

const PLANS: PlanType[] = ["pro", "max_5x", "max_20x", "api"];

export function PlanToggle({
  current,
  onChange,
}: {
  current: PlanType;
  onChange: (plan: PlanType) => void;
}) {
  const t = useTranslations("plans");
  return (
    <div className="flex items-center gap-0.5 rounded border border-border bg-card p-0.5">
      {PLANS.map((plan) => (
        <Button
          key={plan}
          variant="ghost"
          size="sm"
          onClick={() => onChange(plan)}
          className={cn(
            "h-7 px-2.5 text-xs rounded-sm lowercase font-semibold",
            current === plan
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              : "text-muted-foreground hover:text-primary hover:bg-transparent"
          )}
        >
          {t(plan)}
        </Button>
      ))}
    </div>
  );
}
