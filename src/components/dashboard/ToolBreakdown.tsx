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
            {tools.slice(0, 12).map((tool) => (
              <TableRow key={tool.name}>
                <TableCell className="font-medium">{tool.name}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
