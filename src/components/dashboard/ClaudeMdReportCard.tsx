"use client";

import type { ClaudeMdScore } from "@/lib/claudeMdAnalyzer";

export function ClaudeMdReportCard({
  score,
  locale,
}: {
  score: ClaudeMdScore;
  locale: "ja" | "en";
}) {
  const MONO_FONT =
    "ui-monospace, 'JetBrains Mono', 'SF Mono', Consolas, 'Courier New', monospace";
  const CYAN = "#22d3ee";
  const CYAN_DIM = "rgba(34, 211, 238, 0.6)";
  const BG = "#050813";
  const CARD_BG = "rgba(15, 23, 42, 0.7)";
  const BORDER = "rgba(34, 211, 238, 0.25)";
  const FG = "#f1f5f9";
  const MUTED = "#94a3b8";

  const labels =
    locale === "ja"
      ? {
          title: "CLAUDE.md スコア",
          score: "総合スコア",
          lines: "行数",
          cache: "キャッシュ",
          dup: "重複",
          structure: "構造",
          issues: "問題点",
          noIssue: "問題は見つかりませんでした 👍",
        }
      : {
          title: "CLAUDE.md Score",
          score: "Total score",
          lines: "Lines",
          cache: "Cache",
          dup: "Duplication",
          structure: "Structure",
          issues: "Issues",
          noIssue: "No issues 👍",
        };

  const issueLabels: Record<string, { ja: string; en: string }> = {
    line_count: {
      ja: "行数が多すぎます",
      en: "Too many lines",
    },
    cache_dynamic: {
      ja: "先頭が動的でキャッシュに乗りません",
      en: "Dynamic top — hurts cache",
    },
    duplication: {
      ja: "重複した内容があります",
      en: "Duplicate lines detected",
    },
    structure: {
      ja: "セクション見出しが不足しています",
      en: "Missing section headers",
    },
  };

  const scoreColor =
    score.total >= 80 ? "#10b981" : score.total >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div
      id="claude-md-report"
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
            }}
          >
            {"// claudecoach"}
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              marginTop: "4px",
              letterSpacing: "-0.01em",
            }}
          >
            {labels.title}
          </div>
        </div>
        <svg
          width={140}
          height={34}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block" }}
        >
          <rect
            x={0.5}
            y={0.5}
            width={139}
            height={33}
            rx={4}
            ry={4}
            fill="rgba(34, 211, 238, 0.1)"
            stroke={CYAN_DIM}
            strokeWidth={1}
          />
          <text
            x={70}
            y={17}
            fontFamily={MONO_FONT}
            fontSize={12}
            fontWeight={700}
            letterSpacing="1"
            fill={CYAN}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {`${score.lineCount} LINES`}
          </text>
        </svg>
      </div>

      <div
        style={{
          marginTop: "24px",
          textAlign: "center",
          padding: "20px",
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
          borderRadius: "6px",
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
          {labels.score}
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "56px",
            fontWeight: 800,
            color: scoreColor,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score.total}
          <span
            style={{
              fontSize: "20px",
              color: MUTED,
              marginLeft: "4px",
              fontWeight: 600,
            }}
          >
            / 100
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "10px",
          marginTop: "16px",
        }}
      >
        <Tile label={labels.lines} value={score.lineCountScore} />
        <Tile label={labels.cache} value={score.cacheScore} />
        <Tile label={labels.dup} value={score.duplicationScore} />
        <Tile label={labels.structure} value={score.structureScore} />
      </div>

      <div
        style={{
          marginTop: "16px",
          padding: "16px",
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
          borderRadius: "6px",
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
          {labels.issues}
        </div>
        {score.issues.length === 0 ? (
          <div style={{ marginTop: "8px", fontSize: "14px", color: FG }}>
            {labels.noIssue}
          </div>
        ) : (
          score.issues.map((i) => (
            <div
              key={i.id}
              style={{
                marginTop: "6px",
                fontSize: "14px",
                color: FG,
              }}
            >
              ❌ {issueLabels[i.id]?.[locale] ?? i.id}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          marginTop: "20px",
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

function Tile({ label, value }: { label: string; value: number }) {
  const MUTED = "#94a3b8";
  const CARD_BG = "rgba(15, 23, 42, 0.7)";
  const BORDER_DIM = "rgba(34, 211, 238, 0.15)";

  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "6px",
        background: CARD_BG,
        border: `1px solid ${BORDER_DIM}`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: MUTED,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "4px",
          fontSize: "22px",
          fontWeight: 800,
          color,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

