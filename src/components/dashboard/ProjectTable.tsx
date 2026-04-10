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
import type { ProjectData } from "@/types";

export function ProjectTable({ projects }: { projects: ProjectData[] }) {
  const t = useTranslations("dashboard");
  const maxCost = Math.max(...projects.map((p) => p.cost), 0.01);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="mr-1">{"//"}</span>
          {t("projects")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("project")}</TableHead>
              <TableHead className="text-right">{t("messages")}</TableHead>
              <TableHead className="text-right">{t("api_cost")}</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.projectName}>
                <TableCell className="font-medium truncate max-w-[200px]">
                  {p.projectName}
                </TableCell>
                <TableCell className="text-right">{p.messageCount}</TableCell>
                <TableCell className="text-right tabular-nums text-primary font-semibold">
                  ${p.cost.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="h-1.5 bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                      style={{ width: `${(p.cost / maxCost) * 100}%` }}
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
