"use client";

import type { DashboardData, Pattern, PlanType, RuleId } from "@/types";
import { PLAN_LABELS } from "@/lib/pricing";

const PATTERN_PRIORITY: RuleId[] = [
  "clarification_loop",
  "long_prompt",
  "low_cache",
  "opus_overuse",
  "bash_heavy",
  "long_session",
  "polite_words",
];

const PATTERN_LABELS_JA: Record<RuleId, string> = {
  long_prompt: "プロンプトが長すぎます",
  clarification_loop: "確認往復が多いです",
  low_cache: "キャッシュが効率的に使われていません",
  opus_overuse: "Opusを多用しています",
  long_session: "作業時間が長すぎます",
  polite_words: "不要な丁寧表現が多いです",
  bash_heavy: "Bash出力でトークンを消費しています",
};

const PATTERN_LABELS_EN: Record<RuleId, string> = {
  long_prompt: "Prompts are too long",
  clarification_loop: "Too many clarification rounds",
  low_cache: "Low cache hit rate",
  opus_overuse: "Opus overuse",
  long_session: "Sessions are too long",
  polite_words: "Unnecessary polite phrases",
  bash_heavy: "Bash output is burning tokens",
};

function topPattern(patterns: Pattern[]): Pattern | null {
  for (const id of PATTERN_PRIORITY) {
    const p = patterns.find((x) => x.id === id && x.detected);
    if (p) return p;
  }
  return null;
}

function formatMonth(locale: "ja" | "en"): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return locale === "ja" ? `${y}年${m}月` : `${y}-${String(m).padStart(2, "0")}`;
}

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

export function DiagnosisCard({
  data,
  plan,
  locale,
  savings,
}: {
  data: DashboardData;
  plan: PlanType;
  locale: "ja" | "en";
  savings: number;
}) {
  const top = topPattern(data.patterns);
  const topLabel =
    top &&
    (locale === "ja"
      ? PATTERN_LABELS_JA[top.id as RuleId]
      : PATTERN_LABELS_EN[top.id as RuleId]);
  const totalTokens = data.totalInputTokens + data.totalOutputTokens;
  const planLabel = PLAN_LABELS[plan];
  const roi = data.planROI;

  const labels =
    locale === "ja"
      ? {
          title: "ClaudeCoach 使用診断書",
          plan: "プラン",
          total: "合計使用量",
          cost: "API換算コスト",
          roi: "プランROI",
          saving: "節約余地",
          worst: "最大の無駄パターン",
          noIssue: "気になる使い方は見つかりませんでした 👍",
        }
      : {
          title: "ClaudeCoach Usage Report",
          plan: "Plan",
          total: "Total tokens",
          cost: "API-equivalent cost",
          roi: "Plan ROI",
          saving: "Potential saving",
          worst: "Biggest waste pattern",
          noIssue: "No issues found 👍",
        };

  const MONO_FONT =
    "ui-monospace, 'JetBrains Mono', 'SF Mono', Consolas, 'Courier New', monospace";
  const CYAN = "#22d3ee";
  const CYAN_DIM = "rgba(34, 211, 238, 0.6)";
  const BG = "#050813";
  const CARD_BG = "rgba(15, 23, 42, 0.7)";
  const BORDER = "rgba(34, 211, 238, 0.25)";
  const FG = "#f1f5f9";
  const MUTED = "#64748b";

  return (
    <div
      id="diagnosis-card"
      style={{
        position: "fixed",
        top: 0,
        left: "-99999px",
        width: "720px",
        padding: "40px",
        fontFamily: MONO_FONT,
        background: BG,
        backgroundImage: `
          linear-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34, 211, 238, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        color: FG,
        borderRadius: "8px",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 0 40px rgba(34, 211, 238, 0.12)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
          paddingBottom: "16px",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              color: CYAN,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "lowercase",
            }}
          >
            {"// claudecoach"}
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: FG,
              marginTop: "4px",
              letterSpacing: "-0.01em",
            }}
          >
            {labels.title}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: MUTED,
              marginTop: "4px",
              fontFamily: MONO_FONT,
            }}
          >
            {formatMonth(locale)}
          </div>
        </div>
        <svg
          width={180}
          height={34}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block" }}
        >
          <rect
            x={0.5}
            y={0.5}
            width={179}
            height={33}
            rx={4}
            ry={4}
            fill="rgba(34, 211, 238, 0.1)"
            stroke={CYAN_DIM}
            strokeWidth={1}
          />
          <text
            x={90}
            y={17}
            fontFamily={MONO_FONT}
            fontSize={12}
            fontWeight={700}
            letterSpacing="1"
            fill={CYAN}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {`${labels.plan}: ${planLabel}`.toUpperCase()}
          </text>
        </svg>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "20px",
        }}
      >
        <StatBox
          label={labels.total}
          value={`${formatTokens(totalTokens, locale)}${locale === "ja" ? "tok" : ""}`}
        />
        <StatBox label={labels.cost} value={`$${roi.apiEquivalent.toFixed(2)}`} />
        <StatBox
          label={labels.roi}
          value={
            roi.roiRatio != null
              ? `${roi.roiRatio.toFixed(1)}x ${roi.isProfitable ? "✓" : "✗"}`
              : "—"
          }
          highlight={roi.isProfitable === true}
        />
        <StatBox label={labels.saving} value={`$${savings.toFixed(2)}`} />
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "16px",
          borderRadius: "6px",
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: CYAN,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {"// "}
          {labels.worst}
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "16px",
            fontWeight: 700,
            color: FG,
          }}
        >
          {top ? `⚡ ${topLabel}` : labels.noIssue}
        </div>
      </div>

      <div
        style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: `1px solid ${BORDER}`,
          textAlign: "center",
          fontSize: "11px",
          color: MUTED,
          fontWeight: 600,
          letterSpacing: "0.05em",
        }}
      >
        claudecoach-web.vercel.app
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const CYAN = "#22d3ee";
  const FG = "#f1f5f9";
  const MUTED = "#94a3b8";
  const CARD_BG = "rgba(15, 23, 42, 0.7)";
  const BORDER_DIM = "rgba(34, 211, 238, 0.15)";
  const BORDER_HI = "rgba(34, 211, 238, 0.5)";

  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: "6px",
        background: CARD_BG,
        border: `1px solid ${highlight ? BORDER_HI : BORDER_DIM}`,
        boxShadow: highlight ? "0 0 16px rgba(34, 211, 238, 0.15)" : undefined,
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: highlight ? CYAN : MUTED,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        {"// "}
        {label}
      </div>
      <div
        style={{
          marginTop: "6px",
          fontSize: "28px",
          fontWeight: 800,
          color: highlight ? CYAN : FG,
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
