"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { downloadDiagnosisImage } from "@/lib/downloadImage";

export function DownloadReportButton() {
  const t = useTranslations("dashboard");
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadDiagnosisImage(
        "diagnosis-card",
        `claudecoach-report-${stamp}.png`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={t("download_report")}
      aria-label={t("download_report")}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{t("download_report")}</span>
    </button>
  );
}
