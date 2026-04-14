import type { Locale } from "@/types";

export type ClaudeMdIssueId =
  | "line_count"
  | "cache_dynamic"
  | "duplication"
  | "structure";

export type ClaudeMdIssue = {
  id: ClaudeMdIssueId;
  severity: "high" | "medium" | "low";
};

export type ClaudeMdScore = {
  total: number;
  lineCount: number;
  lineCountScore: number;
  cacheScore: number;
  duplicationScore: number;
  structureScore: number;
  issues: ClaudeMdIssue[];
};

function checkDuplication(lines: string[]): number {
  const normalized = lines
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l.length > 12);
  const counts = new Map<string, number>();
  for (const l of normalized) {
    counts.set(l, (counts.get(l) ?? 0) + 1);
  }
  let duplicates = 0;
  counts.forEach((n) => {
    if (n >= 2) duplicates += n - 1;
  });
  const ratio = normalized.length > 0 ? duplicates / normalized.length : 0;
  if (ratio === 0) return 100;
  if (ratio < 0.05) return 80;
  if (ratio < 0.1) return 60;
  if (ratio < 0.2) return 40;
  return 20;
}

export function analyzeClaudeMd(content: string): ClaudeMdScore {
  const lines = content.split("\n");
  const lineCount = lines.length;

  const lineCountScore =
    lineCount <= 100 ? 100 : lineCount <= 200 ? 70 : lineCount <= 300 ? 40 : 10;

  const firstSection = lines.slice(0, 20).join("\n");
  const hasDynamicContent = /\{\{|\$\{|today|現在|今日|now\(\)|<date/i.test(
    firstSection
  );
  const cacheScore = hasDynamicContent ? 30 : 80;

  const duplicationScore = checkDuplication(lines);

  const hasHeaders = lines.filter((l) => l.trim().startsWith("#")).length;
  const structureScore = hasHeaders >= 3 ? 90 : hasHeaders >= 1 ? 60 : 30;

  const total = Math.round(
    lineCountScore * 0.3 +
      cacheScore * 0.3 +
      duplicationScore * 0.2 +
      structureScore * 0.2
  );

  const issues: ClaudeMdIssue[] = [];
  if (lineCountScore < 70) {
    issues.push({
      id: "line_count",
      severity: lineCountScore < 40 ? "high" : "medium",
    });
  }
  if (cacheScore < 60) {
    issues.push({ id: "cache_dynamic", severity: "high" });
  }
  if (duplicationScore < 60) {
    issues.push({
      id: "duplication",
      severity: duplicationScore < 40 ? "high" : "medium",
    });
  }
  if (structureScore < 60) {
    issues.push({
      id: "structure",
      severity: structureScore < 40 ? "medium" : "low",
    });
  }

  return {
    total,
    lineCount,
    lineCountScore,
    cacheScore,
    duplicationScore,
    structureScore,
    issues,
  };
}

export async function generateImprovedClaudeMd(
  content: string,
  score: ClaudeMdScore,
  apiKey: string,
  locale: Locale
): Promise<string> {
  if (!apiKey) throw new Error("API key required");

  const issuesText = score.issues
    .map((i) => `- ${i.id} (${i.severity})`)
    .join("\n");

  const prompt =
    locale === "ja"
      ? `以下のCLAUDE.mdを最適化してください。

問題点：
${issuesText}

最適化の方針：
- 100行以内に削減
- キャッシュに乗りやすい構造（先頭に固定内容）
- 重複を削除
- 重要なルールだけ残す

元のCLAUDE.md：
${content}

改善版のCLAUDE.mdのみを返してください。説明は不要です。`
      : `Optimize the following CLAUDE.md.

Issues:
${issuesText}

Optimization guidelines:
- Reduce to 100 lines or fewer
- Cache-friendly structure (static content at the top)
- Remove duplication
- Keep only the most important rules

Original CLAUDE.md:
${content}

Return only the improved CLAUDE.md. No explanation.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    if (response.status === 401)
      throw new Error(
        locale === "ja" ? "APIキーが無効です" : "Invalid API key"
      );
    if (response.status === 429)
      throw new Error(
        locale === "ja"
          ? "レート制限に達しました"
          : "Rate limit exceeded"
      );
    throw new Error(
      locale === "ja" ? "生成に失敗しました" : "Failed to generate"
    );
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";
  return text
    .replace(/^```(?:markdown|md)?\n/, "")
    .replace(/\n```$/, "")
    .trim();
}
