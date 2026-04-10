"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp } from "lucide-react";
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

export function MessageList({ turns }: { turns: TurnStat[] }) {
  const t = useTranslations("dashboard");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
              <TableHead>
                <SortButton
                  active={sortKey === "time"}
                  dir={sortDir}
                  onClick={() => toggleSort("time")}
                >
                  {t("time")}
                </SortButton>
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
            {sorted.map((turn, i) => (
              <TableRow key={`${turn.timestamp}-${i}`}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatTs(turn.timestamp)}
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
