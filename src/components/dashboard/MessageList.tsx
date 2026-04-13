"use client";

import { Fragment, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TurnStat } from "@/types";
import { cn } from "@/lib/utils";

type SortKey = "time" | "tokens" | "cost";
type SortDir = "asc" | "desc";

function formatTs(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SortButton({
  active,
  dir,
  children,
  onClick,
  align = "left",
}: {
  active: boolean;
  dir: SortDir;
  children: React.ReactNode;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
        align === "right" && "justify-end w-full"
      )}
    >
      {children}
      {active &&
        (dir === "desc" ? (
          <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUp className="h-3 w-3" />
        ))}
    </button>
  );
}

function BreakdownBar({
  label,
  cost,
  tokens,
  total,
  color,
}: {
  label: string;
  cost: number;
  tokens: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min(100, (cost / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          <span className="text-muted-foreground/70 mr-2">
            {tokens.toLocaleString()}
          </span>
          <span className="text-primary">${cost.toFixed(4)}</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function MessageList({ turns }: { turns: TurnStat[] }) {
  const t = useTranslations("dashboard");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<Record<string, "short" | "full">>(
    {}
  );

  function cycleExpand(key: string) {
    setExpanded((prev) => {
      const next = { ...prev };
      const cur = prev[key];
      if (!cur) next[key] = "short";
      else if (cur === "short") next[key] = "full";
      else delete next[key];
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    const copy = turns.slice();
    const mul = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      if (sortKey === "time") {
        return (a.timestamp < b.timestamp ? -1 : 1) * mul;
      }
      if (sortKey === "tokens") {
        return (a.tokens - b.tokens) * mul;
      }
      return (a.cost - b.cost) * mul;
    });
    return copy.slice(0, 100);
  }, [turns, sortKey, sortDir]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="mr-1">{"//"}</span>
          {t("message_list")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>
                <SortButton
                  active={sortKey === "time"}
                  dir={sortDir}
                  onClick={() => toggleSort("time")}
                >
                  {t("time")}
                </SortButton>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                {t("project")}
              </TableHead>
              <TableHead>{t("preview")}</TableHead>
              <TableHead className="text-right">
                <SortButton
                  active={sortKey === "tokens"}
                  dir={sortDir}
                  onClick={() => toggleSort("tokens")}
                  align="right"
                >
                  {t("tokens")}
                </SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton
                  active={sortKey === "cost"}
                  dir={sortDir}
                  onClick={() => toggleSort("cost")}
                  align="right"
                >
                  {t("cost")}
                </SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((turn, i) => {
              const key = `${turn.timestamp}-${i}`;
              const state = expanded[key];
              const isOpen = state !== undefined;
              const previewText =
                state === "full"
                  ? turn.promptText
                  : turn.promptText.slice(0, 200);
              const truncated =
                state !== "full" && turn.promptText.length > 200;
              return (
                <Fragment key={key}>
                  <TableRow
                    onClick={() => cycleExpand(key)}
                    className="cursor-pointer"
                  >
                    <TableCell className="text-muted-foreground">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatTs(turn.timestamp)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell whitespace-nowrap text-xs text-muted-foreground/80 max-w-[140px] truncate">
                      {turn.projectName}
                    </TableCell>
                    <TableCell className="max-w-[420px] truncate text-sm">
                      {turn.promptText}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-primary">
                      {turn.tokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-primary">
                      ${turn.cost.toFixed(4)}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell />
                      <TableCell
                        colSpan={5}
                        className="py-4"
                        onClick={() => cycleExpand(key)}
                      >
                        <div className="space-y-4 cursor-pointer">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                              <span className="mr-1">{"//"}</span>
                              {state === "full"
                                ? t("full_prompt")
                                : t("preview")}
                            </div>
                            <div className="whitespace-pre-wrap break-words rounded-md border border-border bg-background/60 p-3 text-sm font-mono leading-relaxed max-h-72 overflow-auto">
                              {previewText}
                              {truncated && (
                                <span className="text-muted-foreground/70">
                                  …{" "}
                                  <span className="underline">
                                    {t("click_for_more")}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                              <span className="mr-1">{"//"}</span>
                              {t("breakdown")}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <BreakdownBar
                                label={t("input_tokens")}
                                cost={turn.inputCost}
                                tokens={turn.inputTokens}
                                total={turn.cost}
                                color="bg-cyan-500"
                              />
                              <BreakdownBar
                                label={t("output_tokens")}
                                cost={turn.outputCost}
                                tokens={turn.outputTokens}
                                total={turn.cost}
                                color="bg-emerald-500"
                              />
                              <BreakdownBar
                                label={t("cache_read")}
                                cost={turn.cacheReadCost}
                                tokens={turn.cacheReadTokens}
                                total={turn.cost}
                                color="bg-violet-500"
                              />
                              <BreakdownBar
                                label={t("cache_write")}
                                cost={turn.cacheCreationCost}
                                tokens={turn.cacheCreationTokens}
                                total={turn.cost}
                                color="bg-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
