"use client";

import { useLocale } from "@/lib/i18n-provider";
import { Button } from "@/components/ui/button";

export function LangToggle() {
  const { locale, setLocale } = useLocale();
  const next = locale === "ja" ? "en" : "ja";
  const label = locale === "ja" ? "[EN]" : "[JA]";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLocale(next)}
      className="h-8 px-3 text-xs font-semibold bg-card border-border text-muted-foreground hover:text-primary hover:bg-card"
    >
      {label}
    </Button>
  );
}
