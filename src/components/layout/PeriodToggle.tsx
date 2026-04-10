"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { PeriodType } from "@/types";
import { cn } from "@/lib/utils";

export function PeriodToggle({
  current,
  onChange,
}: {
  current: PeriodType;
  onChange: (period: PeriodType) => void;
}) {
  const t = useTranslations("common");
  return (
    <div className="flex items-center gap-0.5 rounded border border-border bg-card p-0.5">
      {(["weekly", "monthly"] as PeriodType[]).map((p) => (
        <Button
          key={p}
          variant="ghost"
          size="sm"
          onClick={() => onChange(p)}
          className={cn(
            "h-7 px-3 text-xs rounded-sm lowercase font-semibold",
            current === p
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              : "text-muted-foreground hover:text-primary hover:bg-transparent"
          )}
        >
          {t(p)}
        </Button>
      ))}
    </div>
  );
}
