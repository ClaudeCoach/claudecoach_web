# ClaudeCoach - Tips Database 機能 設計書

## 概要
実証済みのClaude Codeトークン削減tipsをデータベース化し、
ユーザーの実データと照合して具体的な節約額付きの
パーソナライズ改善提案を生成する機能。

既存のルールベース改善提案・Haiku AI提案を
この仕組みに置き換え・強化する。

---

## ファイル構成（追加・変更するファイルのみ）

```
src/
├── lib/
│   ├── tips.ts              # 新規：tipsデータベース
│   ├── savingsEstimator.ts  # 新規：節約額計算エンジン
│   └── haiku.ts             # 変更：tipsを参照するよう改修
│
└── components/
    └── dashboard/
        └── Suggestions.tsx  # 変更：表示UIの改修
```

---

## tipsデータベース（src/lib/tips.ts）

```typescript
export type Tip = {
  id: string
  // 発動条件（ユーザーデータと照合するフィールド名と閾値）
  condition: {
    field: keyof UserStats   // 照合するフィールド
    operator: '>' | '<' | '>=' | '<='
    threshold: number
  }
  // 削減率（実測値・公式データに基づく）
  savingRate: number         // 0.0〜1.0
  savingType: 'token' | 'cost'  // トークン削減か費用削減か
  // 難易度
  difficulty: 'easy' | 'medium' | 'hard'
  // 出典
  source: string
  sourceUrl?: string
  // 提案文（日英）
  titleJa: string
  titleEn: string
  descriptionJa: string
  descriptionEn: string
  // 具体的な方法（日英）
  howToJa: string
  howToEn: string
}

export type UserStats = {
  avgSessionMinutes: number      // 平均セッション時間（分）
  claudeMdLines: number          // CLAUDE.mdの行数
  opusRatio: number              // Opus使用率（0-1）
  cacheHitRate: number           // キャッシュヒット率（0-1）
  clarificationRatio: number     // 確認往復率（0-1）
  longPromptRatio: number        // 長いプロンプト率（0-1）
  politeWordRatio: number        // 丁寧表現率（0-1）
  avgPromptLength: number        // 平均プロンプト文字数
  subagentRatio: number          // サブエージェント使用率（0-1）
  thinkingTokenRatio: number     // thinkingトークン使用率（0-1）
}

// ============================================================
// tipsデータベース
// 削減率はccusage・zenn・note・公式ドキュメントの実測値に基づく
// ============================================================

export const TIPS_DATABASE: Tip[] = [

  // ① セッション管理系
  {
    id: 'compact_timing',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 120 },
    savingRate: 0.35,
    savingType: 'token',
    difficulty: 'easy',
    source: 'zenn: Claude Codeのトークン消費を半減させる5フェーズ運用術',
    sourceUrl: 'https://zenn.dev/yamato_snow/articles/8eff833984b842',
    titleJa: '早めの /compact でトークン消費を35%削減',
    titleEn: 'Use /compact early to cut token usage by 35%',
    descriptionJa: 'セッション時間が長くなるほどコンテキストが肥大化し、同じ作業でも消費トークンが雪だるま式に増えます。',
    descriptionEn: 'The longer your session, the more context bloats. The same task costs exponentially more tokens over time.',
    howToJa: 'コンテキスト使用率が50%を超えたら /compact を実行。タスクの区切りごとに /clear も有効。',
    howToEn: 'Run /compact when context usage exceeds 50%. Use /clear between distinct tasks.',
  },

  {
    id: 'session_task_split',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 180 },
    savingRate: 0.30,
    savingType: 'token',
    difficulty: 'easy',
    source: 'note: Claude Codeのトークン使用量がすぐに上限を迎える問題を根本から解決する',
    titleJa: 'タスクごとに新しいセッションで30%削減',
    titleEn: 'Start fresh sessions per task to save 30%',
    descriptionJa: '1つのセッションで複数タスクを続けると、過去の会話全体が毎回コンテキストに積み上がります。',
    descriptionEn: 'Multiple tasks in one session means all previous conversation history loads every time.',
    howToJa: '1タスク1セッションを原則にする。セッション開始前に /clear でコンテキストをリセット。',
    howToEn: 'One task, one session. Use /clear before starting a new task.',
  },

  // ② モデル選択系
  {
    id: 'opus_to_sonnet',
    condition: { field: 'opusRatio', operator: '>', threshold: 0.5 },
    savingRate: 0.60,
    savingType: 'cost',
    difficulty: 'easy',
    source: 'Anthropic公式料金表（Opus $15/MTok vs Sonnet $3/MTok）',
    sourceUrl: 'https://www.anthropic.com/pricing',
    titleJa: 'Sonnetファーストで60%コスト削減',
    titleEn: 'Switch to Sonnet-first approach, save 60% on costs',
    descriptionJa: 'Opusは複雑な推論タスク向けです。単純な編集・リファクタリング・テスト作成はSonnetで十分な品質が出ます。',
    descriptionEn: 'Opus is for complex reasoning. Simple edits, refactoring, and test writing work fine with Sonnet.',
    howToJa: '/model sonnet でデフォルトをSonnetに変更。複雑なアーキテクチャ設計の時だけ /model opus に切り替える。',
    howToEn: 'Set default to Sonnet with /model sonnet. Switch to /model opus only for complex architectural decisions.',
  },

  {
    id: 'thinking_tokens',
    condition: { field: 'thinkingTokenRatio', operator: '>', threshold: 0.3 },
    savingRate: 0.70,
    savingType: 'token',
    difficulty: 'medium',
    source: 'zenn: Claude Codeのトークン消費を半減させる5フェーズ運用術',
    titleJa: 'Extended Thinkingをタスク別に制御して70%削減',
    titleEn: 'Control Extended Thinking per task to save 70%',
    descriptionJa: 'Extended Thinkingはデフォルト有効で、出力トークンとして課金されます。単純なバグ修正やリネームには不要です。',
    descriptionEn: 'Extended Thinking is on by default and billed as output tokens. Simple bug fixes and renames don\'t need it.',
    howToJa: '/effort low で思考レベルを下げる。複雑なタスクだけ /effort high に切り替える。',
    howToEn: 'Use /effort low for simple tasks. Switch to /effort high only for complex reasoning.',
  },

  // ③ CLAUDE.md最適化系
  {
    id: 'claude_md_length',
    condition: { field: 'claudeMdLines', operator: '>', threshold: 100 },
    savingRate: 0.15,
    savingType: 'token',
    difficulty: 'medium',
    source: 'drona23/claude-token-efficient実測値・zenn記事',
    titleJa: 'CLAUDE.mdを100行以下に削減して15%節約',
    titleEn: 'Trim CLAUDE.md to under 100 lines, save 15%',
    descriptionJa: 'CLAUDE.mdは全リクエストに毎回含まれます。500行のCLAUDE.mdは毎回数千トークンを消費します。',
    descriptionEn: 'CLAUDE.md loads with every request. A 500-line file burns thousands of tokens every time.',
    howToJa: '重要なルールだけ残して100行以下に削減。詳細はSkillファイルに移動して必要時だけ読み込む。',
    howToEn: 'Keep only essential rules under 100 lines. Move details to Skill files loaded on-demand.',
  },

  {
    id: 'cache_structure',
    condition: { field: 'cacheHitRate', operator: '<', threshold: 0.5 },
    savingRate: 0.25,
    savingType: 'token',
    difficulty: 'medium',
    source: 'Anthropic公式ドキュメント：Prompt Caching',
    sourceUrl: 'https://code.claude.com/docs/en/costs',
    titleJa: 'キャッシュ構造の改善でトークンを25%削減',
    titleEn: 'Fix cache structure to cut tokens by 25%',
    descriptionJa: 'CLAUDE.mdの先頭に変わらない固定内容をまとめることでキャッシュヒット率が向上し、再処理コストが削減されます。',
    descriptionEn: 'Putting stable, unchanging content at the top of CLAUDE.md improves cache hit rates and reduces reprocessing costs.',
    howToJa: 'CLAUDE.mdの先頭に固定ルール・プロジェクト概要を配置。動的な内容（日付・状態）は末尾に移動。',
    howToEn: 'Put fixed rules and project overview at the top of CLAUDE.md. Move dynamic content (dates, state) to the bottom.',
  },

  // ④ プロンプト改善系
  {
    id: 'polite_words',
    condition: { field: 'politeWordRatio', operator: '>', threshold: 0.3 },
    savingRate: 0.02,
    savingType: 'token',
    difficulty: 'easy',
    source: 'MindStudio: 18 Claude Code Token Management Hacks',
    titleJa: '丁寧表現を削除してプロンプトを簡潔に',
    titleEn: 'Remove filler phrases to streamline prompts',
    descriptionJa: '「よろしくお願いします」「もし可能であれば」「〜していただけますか」はトークンの無駄です。Claudeは命令形で動きます。',
    descriptionEn: '"Please", "if possible", "could you" are wasted tokens. Claude responds to direct instructions.',
    howToJa: '命令形で書く。「〜してください」→「〜して」。丁寧さは不要。',
    howToEn: 'Write imperatively. "Please fix" → "Fix". Claude doesn\'t need politeness.',
  },

  {
    id: 'long_prompt',
    condition: { field: 'longPromptRatio', operator: '>', threshold: 0.3 },
    savingRate: 0.10,
    savingType: 'token',
    difficulty: 'easy',
    source: 'Qiita: Claudeの使用量が爆増する原因と節約テクニック',
    titleJa: '長いプロンプトを箇条書きに変えて10%削減',
    titleEn: 'Convert long prompts to bullet points, save 10%',
    descriptionJa: '段落形式の長い指示は同じ内容でも箇条書きより多くのトークンを消費します。',
    descriptionEn: 'Paragraph-style instructions use more tokens than the same content in bullet points.',
    howToJa: '指示は箇条書きで書く。1文1指示。背景説明は最小限に。',
    howToEn: 'Write instructions as bullet points. One instruction per line. Minimize background explanation.',
  },

  {
    id: 'clarification_loop',
    condition: { field: 'clarificationRatio', operator: '>', threshold: 0.2 },
    savingRate: 0.20,
    savingType: 'token',
    difficulty: 'medium',
    source: 'Anthropic公式: Usage limit best practices',
    titleJa: '確認往復を減らしてトークンを20%削減',
    titleEn: 'Reduce back-and-forth to cut tokens by 20%',
    descriptionJa: '「これで合ってますか？」の往復は見かけ以上にコストがかかります。確認のたびにコンテキスト全体が再送されます。',
    descriptionEn: '"Is this right?" back-and-forth costs more than it looks. The entire context resends with each confirmation.',
    howToJa: '最初から出力形式・制約・完了条件を明示する。「〜の形式でJSONで返して」「必ず〇〇を含める」など。',
    howToEn: 'Specify output format, constraints, and success criteria upfront. "Return as JSON with fields X, Y, Z."',
  },

  // ⑤ サブエージェント系
  {
    id: 'subagent_exploration',
    condition: { field: 'subagentRatio', operator: '<', threshold: 0.1 },
    savingRate: 0.20,
    savingType: 'token',
    difficulty: 'hard',
    source: 'Claude Code公式ドキュメント: Subagents',
    titleJa: 'サブエージェントで調査コストをメインセッションから切り離す',
    titleEn: 'Use subagents to isolate exploration cost from main session',
    descriptionJa: 'ファイル調査・コード探索をメインセッションで行うとコンテキストが汚染されます。Taskツールでサブエージェントに委託するとメインセッションのトークンを節約できます。',
    descriptionEn: 'Exploring files in the main session pollutes context. Delegating to subagents via Task tool keeps your main context clean.',
    howToJa: 'コード調査・ファイル探索はTaskツールでサブエージェントに委託。結果のサマリーだけをメインセッションに返す。',
    howToEn: 'Delegate code exploration to subagents via Task tool. Only the summary comes back to the main session.',
  },

]
```

---

## 節約額計算エンジン（src/lib/savingsEstimator.ts）

```typescript
import { TIPS_DATABASE, Tip, UserStats } from './tips'
import { DashboardData, PlanType } from '@/types'

export type SavingsEstimate = {
  tip: Tip
  estimatedTokenSaving: number    // 削減できるトークン数
  estimatedCostSaving: number     // 削減できる費用（USD）
  percentOfTotal: number          // 月間使用量に占める割合
  priority: number                // 優先度スコア（節約額が大きい順）
}

// プラン別の月間コスト（ROI計算用）
const PLAN_COSTS: Record<PlanType, number> = {
  pro: 20,
  max_5x: 100,
  max_20x: 200,
  api: 0,  // APIは従量課金なのでapi換算コストをそのまま使う
}

// モデル別トークン単価（USD per token）
const TOKEN_PRICE = {
  input: 0.000003,   // Sonnet $3/MTok
  output: 0.000015,  // Sonnet $15/MTok
}

export function estimateAllSavings(
  data: DashboardData,
  userStats: UserStats
): SavingsEstimate[] {

  const totalTokens = data.totalTokens
  const totalCost = data.totalCost

  return TIPS_DATABASE
    .filter(tip => matchesCondition(tip, userStats))
    .map(tip => {
      let estimatedTokenSaving = 0
      let estimatedCostSaving = 0

      if (tip.savingType === 'token') {
        estimatedTokenSaving = totalTokens * tip.savingRate
        estimatedCostSaving = estimatedTokenSaving * TOKEN_PRICE.input
      } else {
        // cost系はAPI換算コストに対して計算
        estimatedCostSaving = totalCost * tip.savingRate
        estimatedTokenSaving = estimatedCostSaving / TOKEN_PRICE.input
      }

      const percentOfTotal = (estimatedTokenSaving / totalTokens) * 100

      return {
        tip,
        estimatedTokenSaving: Math.round(estimatedTokenSaving),
        estimatedCostSaving,
        percentOfTotal,
        priority: estimatedTokenSaving,  // トークン節約量で優先度付け
      }
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)  // 上位5件のみ返す
}

function matchesCondition(tip: Tip, stats: UserStats): boolean {
  const value = stats[tip.condition.field]
  if (value === undefined) return false

  switch (tip.condition.operator) {
    case '>':  return value > tip.condition.threshold
    case '<':  return value < tip.condition.threshold
    case '>=': return value >= tip.condition.threshold
    case '<=': return value <= tip.condition.threshold
    default:   return false
  }
}

// UserStatsをDashboardDataから生成するヘルパー
export function buildUserStats(data: DashboardData): UserStats {
  return {
    avgSessionMinutes: data.stats.avgSessionMinutes,
    claudeMdLines: data.stats.claudeMdLines ?? 0,
    opusRatio: data.stats.opusRatio,
    cacheHitRate: data.stats.cacheHitRate,
    clarificationRatio: data.stats.clarificationRatio,
    longPromptRatio: data.stats.longPromptRatio,
    politeWordRatio: data.stats.politeWordRatio,
    avgPromptLength: data.stats.avgPromptLength,
    subagentRatio: data.stats.subagentRatio ?? 0,
    thinkingTokenRatio: data.stats.thinkingTokenRatio ?? 0,
  }
}
```

---

## haiku.tsの改修

```typescript
// lib/haiku.ts の getAISuggestions() を改修
// tipsデータベースと節約額推定をプロンプトに含める

import { estimateAllSavings, buildUserStats } from './savingsEstimator'

export async function getAISuggestions(
  data: DashboardData,
  samplePrompts: string[],
  apiKey: string,
  locale: Locale
): Promise<Suggestion[]> {

  if (!apiKey) return []

  const userStats = buildUserStats(data)
  const estimates = estimateAllSavings(data, userStats)
  const lang = locale === 'ja' ? '日本語' : 'English'

  const prompt = `
You are a Claude Code usage optimization expert.
Analyze the user's actual data and generate 3 specific improvement suggestions in ${lang}.

## User's Actual Data
- Total tokens this month: ${data.totalTokens.toLocaleString()}
- API-equivalent cost: $${data.totalCost.toFixed(2)}
- Plan: ${data.planROI.plan}
- Avg session duration: ${userStats.avgSessionMinutes} min
- Opus usage rate: ${(userStats.opusRatio * 100).toFixed(0)}%
- Cache hit rate: ${(userStats.cacheHitRate * 100).toFixed(0)}%
- Clarification loop rate: ${(userStats.clarificationRatio * 100).toFixed(0)}%
- Long prompt rate (>500 chars): ${(userStats.longPromptRatio * 100).toFixed(0)}%

## Evidence-Based Tips (with estimated savings for THIS user)
${estimates.map(e => `
### ${e.tip.titleEn}
- Source: ${e.tip.source}
- Estimated saving for this user: ${e.estimatedTokenSaving.toLocaleString()} tokens/month (${e.percentOfTotal.toFixed(0)}% of total)
- Estimated cost saving: $${e.estimatedCostSaving.toFixed(2)}/month
- How: ${e.tip.howToEn}
`).join('\n')}

## Sample Prompts from This User
${samplePrompts.slice(0, 5).join('\n')}

## Instructions
1. Pick the 3 most impactful tips from the list above
2. Customize the description using the user's ACTUAL numbers
3. Generate a concrete before/after example based on the sample prompts
4. Every suggestion MUST include a specific token or cost saving number

Return JSON array only:
[{
  "title": "...",
  "description": "...(must include specific numbers like X tokens or $Y)",
  "before": "...(actual example from their prompts)",
  "after": "...(improved version)",
  "estimatedSaving": <number of tokens>
}]
`

  // API呼び出し（既存コードを流用）
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const responseData = await response.json()
  const text = responseData.content[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
```

---

## Suggestions.tsxの改修

```typescript
// 既存のSuggestions.tsxに節約額の表示を追加

// 変更点のみ記載：
// 1. SavingsEstimate型をインポート
// 2. 各提案カードに以下を追加表示：

// 追加するUI要素（カードの下部に追加）
<div className="mt-2 flex items-center gap-2 text-sm">
  <span className="text-green-600 font-medium">
    月{estimate.estimatedTokenSaving.toLocaleString()}トークン削減
  </span>
  <span className="text-gray-400">·</span>
  <span className="text-gray-500 text-xs">
    {estimate.tip.source}
  </span>
</div>
```

---

## コミュニティtips投稿の仕組み（将来対応）

```
現時点ではハードコードで実装する。
将来的にはGitHubのPull Requestで
コミュニティからtipsを募集する。

CONTRIBUTING.md に以下を追記：
「新しいtipsを追加するには
 src/lib/tips.ts にTip型に従って追加し
 PRを送ってください」

→ コントリビューターが増える
→ GitHubのスターが増える
→ プロダクトの信頼性が上がる
```

---

## 実装順序

```
1. src/lib/tips.ts を作成
   （上記のTIPSデータベースをそのまま実装）

2. src/lib/savingsEstimator.ts を作成
   （条件マッチング・節約額計算）

3. src/lib/haiku.ts を改修
   （tipsと節約額をプロンプトに含める）

4. src/components/dashboard/Suggestions.tsx を改修
   （節約額・出典を表示するUI追加）

5. 動作確認
   ・APIキーなし → ルールベース提案に節約額が表示される
   ・APIキーあり → AI提案に具体的な数字が含まれる
```

---

## 変更禁止事項

```
・既存のダッシュボードレイアウト
・既存のカードデザイン・グラフ
・プライバシー設計（会話内容は外に出さない）
・言語切り替え・プラン切り替えの動作
```

