"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartData } from "@/types";
import { useLocale } from "@/lib/i18n-provider";
import {
  INPUT_TOKEN_PRICE,
  OUTPUT_TOKEN_PRICE,
  CACHE_READ_PRICE,
} from "@/lib/pricing";

function formatDateLabel(dateStr: string, locale: "ja" | "en"): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  void locale;
  return `${mm}-${dd}`;
}

export function TokenChart({ data }: { data: ChartData[] }) {
  const t = useTranslations("dashboard");
  const { locale } = useLocale();

  const chartData = data.map((d) => ({
    label: formatDateLabel(d.date, locale),
    Input: Math.round(d.inputTokens * INPUT_TOKEN_PRICE * 100) / 100,
    Output: Math.round(d.outputTokens * OUTPUT_TOKEN_PRICE * 100) / 100,
    Cache: Math.round(d.cacheReadTokens * CACHE_READ_PRICE * 100) / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="mr-1">{"//"}</span>
          {t("chart_title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 14%)" />
            <XAxis
              dataKey="label"
              fontSize={11}
              stroke="hsl(215 15% 58%)"
              tick={{ fill: "hsl(215 15% 58%)" }}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              fontSize={11}
              stroke="hsl(215 15% 58%)"
              tick={{ fill: "hsl(215 15% 58%)" }}
            />
            <Tooltip
              formatter={(v) => `$${Number(v).toFixed(2)}`}
              cursor={{ fill: "hsl(187 92% 60% / 0.08)" }}
              contentStyle={{
                backgroundColor: "hsl(222 40% 7%)",
                border: "1px solid hsl(215 25% 14%)",
                borderRadius: 4,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(210 40% 96%)" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey="Cache"
              stackId="a"
              fill="hsl(40 70% 55%)"
              name="Cache Read"
            />
            <Bar
              dataKey="Output"
              stackId="a"
              fill="hsl(160 60% 50%)"
            />
            <Bar
              dataKey="Input"
              stackId="a"
              fill="hsl(187 92% 60%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
