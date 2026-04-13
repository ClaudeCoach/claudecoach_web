"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, BarChart3, Loader2, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage, type BenchmarkSnapshot } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types";

type Field = keyof BenchmarkSnapshot;

type ApiResponse = {
  count: number;
  averages: Record<Field, number> | null;
};

const FIELDS: Field[] = [
  "long_prompt",
  "clarification",
  "cache_hit",
  "opus",
  "session_min",
  "polite",
  "cost",
];

// For these, lower = better. For others (cache_hit), higher = better.
const LOWER_BETTER: Field[] = [
  "long_prompt",
  "clarification",
  "opus",
  "session_min",
  "polite",
  "cost",
];

function buildSnapshot(data: DashboardData): BenchmarkSnapshot {
  const get = (id: string) =>
    data.patterns.find((p) => p.id === id)?.value ?? 0;
  return {
    long_prompt: get("long_prompt"),
    clarification: get("clarification_loop"),
    cache_hit: get("low_cache"),
    opus: get("opus_overuse"),
    session_min: Math.min(get("long_session"), 24 * 60),
    polite: get("polite_words"),
    cost: Math.min(data.totalCost, 100000),
  };
}

function formatValue(field: Field, value: number): string {
  if (field === "session_min") return value.toFixed(0);
  if (field === "cost") return `$${value.toFixed(2)}`;
  return `${(value * 100).toFixed(0)}%`;
}

function diffSign(field: Field, you: number, avg: number): "good" | "bad" | "eq" {
  const diff = you - avg;
  if (Math.abs(diff) < 1e-6) return "eq";
  const lowerBetter = LOWER_BETTER.includes(field);
  if (lowerBetter) return diff < 0 ? "good" : "bad";
  return diff > 0 ? "good" : "bad";
}

const SHARE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://claudecoach-web.vercel.app/";

function relativeMagnitude(field: Field, you: number, avg: number): number {
  if (avg === 0 && you === 0) return 0;
  const denom = Math.max(Math.abs(avg), 1e-6);
  return Math.abs(you - avg) / denom;
}

function buildShareText(
  snapshot: BenchmarkSnapshot,
  averages: Record<Field, number>,
  count: number,
  t: (key: string, vars?: Record<string, string>) => string,
  metricLabel: (field: Field) => string
): string {
  const ranked = FIELDS.map((f) => ({
    field: f,
    you: snapshot[f],
    avg: averages[f],
    sign: diffSign(f, snapshot[f], averages[f]),
    mag: relativeMagnitude(f, snapshot[f], averages[f]),
  }));

  const goods = ranked
    .filter((r) => r.sign === "good")
    .sort((a, b) => b.mag - a.mag);
  const bads = ranked
    .filter((r) => r.sign === "bad")
    .sort((a, b) => b.mag - a.mag);

  const picked: typeof ranked = [];
  if (goods[0]) picked.push(goods[0]);
  if (bads[0]) picked.push(bads[0]);
  for (const r of [...goods.slice(1), ...bads.slice(1)]) {
    if (picked.length >= 3) break;
    picked.push(r);
  }

  const lines = picked.map((r) => {
    const icon = r.sign === "good" ? "✅" : "⚠️";
    const label = metricLabel(r.field);
    const you = formatValue(r.field, r.you);
    const avg = formatValue(r.field, r.avg);
    return `${icon} ${label}: ${you} (avg ${avg})`;
  });

  return [
    t("benchmark_share_intro"),
    "",
    ...lines,
    "",
    t("benchmark_share_sample", { count: String(count) }),
    "",
    SHARE_URL,
  ].join("\n");
}

export function BenchmarkCard({ data }: { data: DashboardData }) {
  const t = useTranslations("dashboard");
  const [optin, setOptin] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  const snapshot = buildSnapshot(data);

  function metricLabel(field: Field): string {
    return t(`benchmark_metric_${field}`);
  }

  function onShare() {
    if (!response?.averages) return;
    const text = buildShareText(
      snapshot,
      response.averages,
      response.count,
      t,
      metricLabel
    );
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const fetchAverages = useCallback(async () => {
    try {
      const res = await fetch("/api/benchmark", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const json = (await res.json()) as ApiResponse;
      setResponse(json);
    } catch {
      setError(t("benchmark_error"));
    }
  }, [t]);

  useEffect(() => {
    setOptin(storage.getBenchmarkOptin());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && optin && !response && !loading) {
      fetchAverages();
    }
  }, [hydrated, optin, response, loading, fetchAverages]);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const previous = storage.getBenchmarkLast();
      const res = await fetch("/api/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: snapshot, previous }),
      });
      if (!res.ok) throw new Error("submit failed");
      storage.setBenchmarkLast(snapshot);
      storage.setBenchmarkOptin(true);
      setOptin(true);
      setResponse(null);
      await fetchAverages();
    } catch {
      setError(t("benchmark_error"));
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="mr-1">{"//"}</span>
          {t("benchmark_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!optin && (
          <>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <div className="space-y-1.5">
                <p>{t("benchmark_intro")}</p>
                <p className="text-[11px] leading-snug">
                  {t("benchmark_disclosure")}
                </p>
              </div>
            </div>
            <button
              onClick={submit}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BarChart3 className="h-3.5 w-3.5" />
              )}
              {t("benchmark_join")}
            </button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </>
        )}

        {optin && response && response.averages && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {t("benchmark_count", { count: String(response.count) })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={onShare}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <Share2 className="h-3 w-3" />
                  {t("benchmark_share")}
                </button>
                <button
                  onClick={submit}
                  disabled={loading}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  {t("benchmark_update")}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="text-left font-semibold pb-2">
                      {t("benchmark_metric")}
                    </th>
                    <th className="text-right font-semibold pb-2">
                      {t("benchmark_you")}
                    </th>
                    <th className="text-right font-semibold pb-2">
                      {t("benchmark_avg")}
                    </th>
                    <th className="text-right font-semibold pb-2">
                      {t("benchmark_diff")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FIELDS.map((f) => {
                    const you = snapshot[f];
                    const avg = response.averages![f];
                    const sign = diffSign(f, you, avg);
                    return (
                      <tr key={f} className="border-t border-border">
                        <td className="py-2 text-muted-foreground">
                          {t(`benchmark_metric_${f}`)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatValue(f, you)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-muted-foreground">
                          {formatValue(f, avg)}
                        </td>
                        <td
                          className={cn(
                            "py-2 text-right tabular-nums",
                            sign === "good" && "text-emerald-400",
                            sign === "bad" && "text-amber-400",
                            sign === "eq" && "text-muted-foreground"
                          )}
                        >
                          {sign === "good" && (
                            <ArrowDown className="inline h-3 w-3 mr-0.5" />
                          )}
                          {sign === "bad" && (
                            <ArrowUp className="inline h-3 w-3 mr-0.5" />
                          )}
                          {sign === "good" && t("benchmark_better")}
                          {sign === "bad" && t("benchmark_worse")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </>
        )}

        {optin && !response && !error && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("benchmark_loading")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
