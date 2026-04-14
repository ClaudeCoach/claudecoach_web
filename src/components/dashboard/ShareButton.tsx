"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Image as ImageIcon, Loader2, Share2 } from "lucide-react";
import { PLAN_LABELS } from "@/lib/pricing";
import {
  openTwitterPopup,
  prepareShareImage,
  type ShareImageResult,
} from "@/lib/shareImage";
import { ShareSuccessModal } from "@/components/ui/ShareSuccessModal";
import type { DashboardData, Pattern, PlanType, RuleId } from "@/types";

const SHARE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://claudecoach-web.vercel.app/";

const PATTERN_PRIORITY: RuleId[] = [
  "clarification_loop",
  "long_prompt",
  "low_cache",
  "opus_overuse",
  "bash_heavy",
  "long_session",
  "polite_words",
];

const POLITE_WORDS = [
  "よろしくお願いします",
  "お願いします",
  "ありがとうございます",
  "please",
  "thank you",
];

function countPolite(data: DashboardData): number {
  let n = 0;
  for (const m of data.allMessages) {
    if (m.role !== "user") continue;
    const text = m.promptText.toLowerCase();
    if (POLITE_WORDS.some((w) => text.includes(w.toLowerCase()))) n++;
  }
  return n;
}

function topDetectedPattern(patterns: Pattern[]): Pattern | null {
  for (const id of PATTERN_PRIORITY) {
    const p = patterns.find((x) => x.id === id && x.detected);
    if (p) return p;
  }
  return null;
}

function patternLabelKey(id: RuleId): string {
  return `${id}_title`;
}

function buildShareText(
  data: DashboardData,
  plan: PlanType,
  locale: "ja" | "en",
  tSug: (key: string) => string
): string {
  const planLabel = PLAN_LABELS[plan];
  const api = data.planROI.apiEquivalent.toFixed(2);
  const roi = data.planROI.roiRatio;
  const isProfitable = data.planROI.isProfitable;
  const top = topDetectedPattern(data.patterns);
  const topTitle = top ? tSug(patternLabelKey(top.id as RuleId)) : null;
  const politeCount = countPolite(data);

  const lines: string[] = [];

  if (locale === "ja") {
    lines.push("ClaudeCoachで分析した結果👇");
    if (plan !== "api" && roi !== null) {
      lines.push(
        `・${planLabel} ROI ${roi.toFixed(1)}倍${isProfitable ? "✅" : "❌"}（API換算$${api}）`
      );
    } else {
      lines.push(`・API換算 $${api}`);
    }
    if (top && topTitle) {
      lines.push(`・最大の無駄: ${topTitle}`);
    } else if (politeCount > 0) {
      lines.push(`・丁寧表現を${politeCount}回も送ってた😇`);
    }
    lines.push(SHARE_URL);
    lines.push("#ClaudeCode");
  } else {
    lines.push("Analyzed my Claude usage 🧵");
    if (plan !== "api" && roi !== null) {
      lines.push(
        `・${planLabel} ROI ${roi.toFixed(1)}x${isProfitable ? " ✅" : " ❌"} ($${api})`
      );
    } else {
      lines.push(`・API cost $${api}`);
    }
    if (top && topTitle) {
      lines.push(`・Biggest waste: ${topTitle}`);
    } else if (politeCount > 0) {
      lines.push(`・Sent filler phrases ${politeCount}x 😇`);
    }
    lines.push(SHARE_URL);
    lines.push("#ClaudeCode");
  }

  return lines.join("\n");
}

export function ShareButton({
  data,
  plan,
  locale,
}: {
  data: DashboardData;
  plan: PlanType;
  locale: "ja" | "en";
}) {
  const t = useTranslations("dashboard");
  const tSug = useTranslations("suggestions");
  const [busy, setBusy] = useState(false);
  const [modalMode, setModalMode] = useState<"clipboard" | "downloaded" | null>(
    null
  );
  const [shareText, setShareText] = useState("");

  function shareTextOnly() {
    const text = buildShareText(data, plan, locale, (key) => tSug(key));
    openTwitterPopup(text);
  }

  async function shareImage() {
    if (busy) return;
    setBusy(true);
    try {
      const text = buildShareText(data, plan, locale, (key) => tSug(key));
      const stamp = new Date().toISOString().slice(0, 10);
      const result: ShareImageResult = await prepareShareImage(
        "diagnosis-card",
        `claudecoach-report-${stamp}.png`
      );
      if (result === "failed") return;
      setShareText(text);
      setModalMode(result);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        onClick={shareImage}
        disabled={busy}
        title={t("share_image")}
        aria-label={t("share_image")}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{t("share_image")}</span>
      </button>
      <button
        onClick={shareTextOnly}
        title={t("share")}
        aria-label={t("share")}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
      <ShareSuccessModal
        open={modalMode !== null}
        mode={modalMode}
        shareText={shareText}
        onClose={() => setModalMode(null)}
      />
    </div>
  );
}
