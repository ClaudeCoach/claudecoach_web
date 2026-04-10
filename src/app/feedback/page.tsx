"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Entry = {
  id: string;
  text: string;
  createdAt: string;
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackPage() {
  const t = useTranslations("feedback");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as { entries: Entry[] };
      setEntries(data.entries);
    } catch {
      setError(t("load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error("submit failed");
      setText("");
      await load();
    } catch {
      setError(t("submit_error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
          <p className="text-sm text-primary/80">
            <span className="mr-1">{"//"}</span>
            {t("anonymous_note")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="mr-1">{"//"}</span>
              {t("write_label")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("placeholder")}
              rows={5}
              maxLength={2000}
              className="w-full rounded border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground tabular-nums">
                {text.length} / 2000
              </span>
              <Button
                onClick={submit}
                disabled={!text.trim() || submitting}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                {submitting ? t("sending") : t("send")}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="mr-1">{"//"}</span>
              {t("recent_label")}{" "}
              <span className="text-primary tabular-nums normal-case">
                [{entries.length}]
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-base text-muted-foreground">{t("loading")}</p>
            ) : entries.length === 0 ? (
              <p className="text-base text-muted-foreground">{t("empty")}</p>
            ) : (
              <ul className="space-y-3">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-l-2 border-primary/40 pl-3 py-1"
                  >
                    <p className="text-xs text-muted-foreground tabular-nums mb-1">
                      {formatTime(entry.createdAt)}
                    </p>
                    <p className="text-base whitespace-pre-wrap break-words">
                      {entry.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="container mx-auto max-w-3xl px-4 py-8 text-center text-xs text-muted-foreground/60">
        {"// claudecoach v1.0 — browser-only, no tracking"}
      </footer>
    </div>
  );
}
