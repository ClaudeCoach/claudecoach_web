"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import {
  Download,
  Image as ImageIcon,
  Loader2,
  Share2,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiKeyInput } from "@/components/upload/ApiKeyInput";
import { ClaudeMdReportCard } from "@/components/dashboard/ClaudeMdReportCard";
import { ShareSuccessModal } from "@/components/ui/ShareSuccessModal";
import { useLocale } from "@/lib/i18n-provider";
import { storage } from "@/lib/storage";
import {
  openTwitterPopup,
  prepareShareImage,
  type ShareImageResult,
} from "@/lib/shareImage";
import {
  analyzeClaudeMd,
  generateImprovedClaudeMd,
  type ClaudeMdScore,
} from "@/lib/claudeMdAnalyzer";
import { cn } from "@/lib/utils";

const SHARE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://claudecoach-web.vercel.app/";

function buildClaudeMdShareText(
  score: ClaudeMdScore,
  locale: "ja" | "en"
): string {
  if (locale === "ja") {
    const lines = [
      `ClaudeCoachでCLAUDE.mdをスコア化したら ${score.total}/100 だった👇`,
      `・行数: ${score.lineCount}`,
    ];
    if (score.issues.length > 0) {
      lines.push(`・問題: ${score.issues.length}件`);
    }
    lines.push(SHARE_URL);
    lines.push("#ClaudeCode");
    return lines.join("\n");
  }
  const lines = [
    `Scored my CLAUDE.md on ClaudeCoach: ${score.total}/100 👇`,
    `・Lines: ${score.lineCount}`,
  ];
  if (score.issues.length > 0) {
    lines.push(`・Issues: ${score.issues.length}`);
  }
  lines.push(SHARE_URL);
  lines.push("#ClaudeCode");
  return lines.join("\n");
}

function scoreClass(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-destructive";
}

function scoreBadge(score: number): string {
  if (score >= 80) return "✅";
  if (score >= 60) return "△";
  return "❌";
}

export default function ClaudeMdCheckerPage() {
  const t = useTranslations("claudeMd");
  const tSug = useTranslations("suggestions");
  const { locale } = useLocale();
  const [content, setContent] = useState("");
  const [score, setScore] = useState<ClaudeMdScore | null>(null);
  const [dragging, setDragging] = useState(false);
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareModalMode, setShareModalMode] = useState<
    "clipboard" | "downloaded" | null
  >(null);
  const [shareText, setShareText] = useState("");

  async function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) ?? "");
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await readFile(file);
    setContent(text);
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readFile(file);
    setContent(text);
  }

  function onAnalyze() {
    if (!content.trim()) return;
    setScore(analyzeClaudeMd(content));
    setImproveError(null);
  }

  function shareTextOnly() {
    if (!score) return;
    openTwitterPopup(buildClaudeMdShareText(score, locale));
  }

  async function shareImage() {
    if (!score || sharing) return;
    setSharing(true);
    try {
      const text = buildClaudeMdShareText(score, locale);
      const stamp = new Date().toISOString().slice(0, 10);
      const result: ShareImageResult = await prepareShareImage(
        "claude-md-report",
        `claudecoach-md-${stamp}.png`
      );
      if (result === "failed") return;
      setShareText(text);
      setShareModalMode(result);
    } finally {
      setSharing(false);
    }
  }

  async function onDownloadImproved() {
    if (!score) return;
    const apiKey = storage.getApiKey();
    if (!apiKey) {
      setImproveError(t("api_key_required"));
      return;
    }
    setImproveError(null);
    setImproving(true);
    try {
      const improved = await generateImprovedClaudeMd(
        content,
        score,
        apiKey,
        locale
      );
      const blob = new Blob([improved], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "CLAUDE.improved.md";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setImproveError(
        err instanceof Error ? err.message : t("generate_failed")
      );
    } finally {
      setImproving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {score && <ClaudeMdReportCard score={score} locale={locale} />}
      <ShareSuccessModal
        open={shareModalMode !== null}
        mode={shareModalMode}
        shareText={shareText}
        onClose={() => setShareModalMode(null)}
      />
      <main className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <ApiKeyInput />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("input_title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "rounded-md border-2 border-dashed p-4 text-center text-sm transition-colors",
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card/30"
              )}
            >
              <label className="cursor-pointer text-primary hover:underline">
                {t("drop_or_pick")}
                <input
                  type="file"
                  accept=".md,text/markdown,text/plain"
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("placeholder")}
              className="h-64 w-full rounded-md border border-border bg-background p-3 font-mono text-xs"
            />
            <div className="flex justify-end">
              <Button onClick={onAnalyze} disabled={!content.trim()}>
                {t("analyze")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {score && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("result_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-3">
                <div className={cn("text-5xl font-bold", scoreClass(score.total))}>
                  {score.total}
                </div>
                <div className="text-sm text-muted-foreground">
                  / 100 {scoreBadge(score.total)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ScoreTile
                  label={t("metric_lines")}
                  value={`${score.lineCount}`}
                  sub={t("metric_lines_sub")}
                  badge={scoreBadge(score.lineCountScore)}
                />
                <ScoreTile
                  label={t("metric_cache")}
                  value={`${score.cacheScore}`}
                  sub={t("metric_cache_sub")}
                  badge={scoreBadge(score.cacheScore)}
                />
                <ScoreTile
                  label={t("metric_dup")}
                  value={`${score.duplicationScore}`}
                  sub={t("metric_dup_sub")}
                  badge={scoreBadge(score.duplicationScore)}
                />
                <ScoreTile
                  label={t("metric_structure")}
                  value={`${score.structureScore}`}
                  sub={t("metric_structure_sub")}
                  badge={scoreBadge(score.structureScore)}
                />
              </div>

              {score.issues.length > 0 ? (
                <div className="space-y-1 rounded-md border border-border bg-card/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("issues_title")}
                  </p>
                  {score.issues.map((issue) => (
                    <p key={issue.id} className="text-sm">
                      ❌ {t(`issue_${issue.id}`)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-500">
                  {tSug("no_issues")}
                </p>
              )}

              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={shareImage}
                    disabled={sharing}
                    variant="outline"
                    size="sm"
                  >
                    {sharing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="mr-2 h-4 w-4" />
                    )}
                    {t("share_with_image")}
                  </Button>
                  <Button onClick={shareTextOnly} variant="outline" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    {t("share_text")}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 border-t border-border pt-4">
                <Button
                  onClick={onDownloadImproved}
                  disabled={improving}
                  variant="outline"
                >
                  {improving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {t("download_improved")}
                  <Download className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t("improved_note")}
                </p>
                {improveError && (
                  <p className="text-xs text-destructive">{improveError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function ScoreTile({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: string;
  sub: string;
  badge: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card/30 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">
        {value} <span className="text-sm">{badge}</span>
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
