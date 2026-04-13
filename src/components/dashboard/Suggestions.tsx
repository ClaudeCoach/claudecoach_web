"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Info, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildRuleSuggestions } from "@/lib/rules";
import { getAiSuggestions, HaikuError } from "@/lib/haiku";
import { storage } from "@/lib/storage";
import { useLocale } from "@/lib/i18n-provider";
import { cn } from "@/lib/utils";
import type {
  AiSuggestion,
  DashboardData,
  RuleId,
  RuleSuggestion,
} from "@/types";

const TITLE_KEYS: Record<RuleId, string> = {
  long_prompt: "long_prompt_title",
  clarification_loop: "clarification_title",
  low_cache: "low_cache_title",
  opus_overuse: "opus_overuse_title",
  long_session: "long_session_title",
  polite_words: "polite_title",
  bash_heavy: "bash_heavy_title",
};
const DESC_KEYS: Record<RuleId, string> = {
  long_prompt: "long_prompt_desc",
  clarification_loop: "clarification_desc",
  low_cache: "low_cache_desc",
  opus_overuse: "opus_overuse_desc",
  long_session: "long_session_desc",
  polite_words: "polite_desc",
  bash_heavy: "bash_heavy_desc",
};

function PriorityBadge({
  priority,
}: {
  priority: "high" | "medium" | "low";
}) {
  const ts = useTranslations("suggestions");
  const label =
    priority === "high"
      ? ts("priority_high")
      : priority === "medium"
      ? ts("priority_medium")
      : ts("priority_low");
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-wider",
        priority === "high" && "bg-red-500/15 text-red-400 border border-red-500/30",
        priority === "medium" && "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        priority === "low" && "bg-muted text-muted-foreground border border-border"
      )}
    >
      {label}
    </span>
  );
}

function RuleCard({ rule }: { rule: RuleSuggestion }) {
  const ts = useTranslations("suggestions");
  return (
    <div className="rounded-md border border-border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <h4 className="text-sm font-semibold">{ts(TITLE_KEYS[rule.id])}</h4>
        </div>
        <PriorityBadge priority={rule.priority} />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {ts(DESC_KEYS[rule.id])}
      </p>
      {rule.estimatedSaving > 0.01 && (
        <div className="mt-2 text-xs text-primary tabular-nums">
          {ts("estimated_saving")}: ${rule.estimatedSaving.toFixed(2)}
        </div>
      )}
    </div>
  );
}

function AiCard({ suggestion }: { suggestion: AiSuggestion }) {
  const ts = useTranslations("suggestions");
  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <h4 className="text-sm font-semibold">{suggestion.title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {suggestion.description}
      </p>
      {(suggestion.before || suggestion.after) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {suggestion.before && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {ts("ai_before")}
              </div>
              <div className="rounded border border-border bg-background/60 p-2 text-xs font-mono whitespace-pre-wrap break-words">
                {suggestion.before}
              </div>
            </div>
          )}
          {suggestion.after && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-primary mb-1">
                {ts("ai_after")}
              </div>
              <div className="rounded border border-primary/40 bg-background/60 p-2 text-xs font-mono whitespace-pre-wrap break-words">
                {suggestion.after}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Suggestions({ data }: { data: DashboardData }) {
  const t = useTranslations("dashboard");
  const ts = useTranslations("suggestions");
  const { locale } = useLocale();

  const rules = buildRuleSuggestions(data.patterns, data);

  const [apiKey, setApiKey] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setApiKey(storage.getApiKey());
  }, []);

  async function runAi() {
    setLoading(true);
    setError(null);
    try {
      const samplePrompts = data.allMessages
        .filter((m) => m.role === "user" && m.promptText)
        .slice(0, 5)
        .map((m) => m.promptText);
      const results = await getAiSuggestions(
        data.patterns,
        samplePrompts,
        apiKey,
        locale
      );
      setAiSuggestions(results);
    } catch (err) {
      if (err instanceof HaikuError) {
        setError(ts(`ai_error_${err.code}`));
      } else {
        setError(ts("ai_error_network"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="mr-1">{"//"}</span>
          {t("suggestions")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            <Lightbulb className="h-3.5 w-3.5" />
            {ts("rule_based")}
          </div>
          {rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((r) => (
                <RuleCard key={r.id} rule={r} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{ts("no_issues")}</p>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            {ts("ai_based")}
          </div>
          {!apiKey ? (
            <div className="rounded-md border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{t("suggestions_ai_locked")}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {aiSuggestions.length === 0 && !loading && !error && (
                <button
                  onClick={runAi}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {ts("ai_generate")}
                </button>
              )}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {ts("ai_generating")}
                </div>
              )}
              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {aiSuggestions.length > 0 && (
                <>
                  {aiSuggestions.map((s, i) => (
                    <AiCard key={i} suggestion={s} />
                  ))}
                  <button
                    onClick={runAi}
                    disabled={loading}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    {ts("ai_regenerate")}
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
