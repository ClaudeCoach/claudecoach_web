"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ToolStat } from "@/types";

function getToolDescription(
  name: string,
  t: (key: string) => string,
): string | null {
  if (name.startsWith("mcp__")) return t("tool_desc_mcp");
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  const map: Record<string, string> = {
    bash: "tool_desc_bash",
    edit: "tool_desc_edit",
    multiedit: "tool_desc_edit",
    write: "tool_desc_write",
    read: "tool_desc_read",
    grep: "tool_desc_grep",
    glob: "tool_desc_glob",
    task: "tool_desc_task",
    webfetch: "tool_desc_webfetch",
    websearch: "tool_desc_websearch",
    todowrite: "tool_desc_todowrite",
    notebookedit: "tool_desc_notebookedit",
    exitplanmode: "tool_desc_exitplanmode",
  };
  const transKey = map[key];
  return transKey ? t(transKey) : null;
}

export function ToolBreakdown({ tools }: { tools: ToolStat[] }) {
  const t = useTranslations("dashboard");
  if (tools.length === 0) return null;
  const maxCost = Math.max(...tools.map((t) => t.cost), 0.0001);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="mr-1">{"//"}</span>
          {t("tools")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tools")}</TableHead>
              <TableHead className="text-right">{t("tool_calls")}</TableHead>
              <TableHead className="text-right">{t("api_cost")}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.slice(0, 12).map((tool) => {
              const desc = getToolDescription(tool.name, t);
              return (
              <TableRow key={tool.name}>
                <TableCell className="font-medium">
                  <div>{tool.name}</div>
                  {desc && (
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      {desc}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {tool.calls.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums text-primary font-semibold">
                  ${tool.cost.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="h-1.5 bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                      style={{ width: `${(tool.cost / maxCost) * 100}%` }}
                    />
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
