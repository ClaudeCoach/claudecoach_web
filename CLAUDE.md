# ClaudeCoach Web版 - 設計書 v3（最終版）

## このドキュメントについて
新しいGitHubアカウント（ClaudeCoach専用・実名なし）に
新規リポジトリを作成してこのファイルをCLAUDE.mdとして置き
Claude Codeに投げる設計書。

---

## 移行方針

### 既存リポジトリ（HiroakiNakano1985/claudecoach）との関係
```
既存リポジトリ：
  FastAPI + Next.js + SQLite
  ローカル動作のみ
  → アーカイブして参照用に残す

新リポジトリ（claudecoach-app/claudecoach）：
  Next.js のみ（バックエンドなし）
  ブラウザ完結
  Vercelにデプロイ
```

### 既存UIから流用・維持するもの（変更禁止）
```
✅ ダッシュボードの全体レイアウト
✅ カード4枚のデザイン（上部サマリー）
✅ Rechartsのグラフスタイル
✅ プロジェクト別コストの表示形式
✅ shadcn/uiのコンポーネントスタイル
✅ 日英言語切り替えボタン（右上固定）
✅ 週次/月次データ切り替えボタン
✅ プラン自動判別 + 手動切り替えボタン
```

---

## コンセプト
**インストールゼロ・URLを開くだけ・会話内容はブラウザ外に出ない**

---

## ターゲットユーザー
```
「Claude Codeを使っている非エンジニア」

・Vibe codingでアプリを作っているビジネスパーソン
・MAXプランで制限に引っかかって不安な人
・トークンが何に使われているかわからない人
・ccusageなどのCLIツールは使えない
・英語ツールはわかるが日本語UIの方が嬉しい
```

---

## 技術スタック

```
フロントエンド：Next.js 14（App Router）+ TypeScript
スタイル：Tailwind CSS + shadcn/ui（既存流用）
グラフ：Recharts（既存流用）
多言語：next-intl（日本語/英語）
ホスティング：Vercel（無料プラン）
バックエンド：なし（完全ブラウザ完結）
DB：なし（localStorageのみ）
AI改善提案：Claude Haiku API
  → ユーザー自身のAPIキーを使用
  → ブラウザから直接Anthropic APIを呼び出す
  → 会話内容はサーバーに一切送らない
```

---

## プライバシー設計（最重要・変更禁止）

```
会話の実テキスト：
  ブラウザ内でのみ処理
  外部に送信しない
  APIキー・パスワード等が含まれていても安全

サーバーに送るもの：
  ❌ 会話の実テキスト
  ❌ コード内容
  ❌ ファイルパス

ブラウザ内のみで処理するもの：
  ✅ 会話テキスト（Haiku改善提案生成に使用）
  ✅ ユーザーのAPIキー（localStorageに保存）

統計データ（将来的にサーバーに送る可能性があるもの）：
  ✅ トークン数の集計
  ✅ プロンプト文字数の統計
  ✅ モデル使用率
  ✅ タイムスタンプ
```

### APIキーの信頼性を担保する方法
```
1. オープンソースで公開（コードを誰でも確認可能）
2. Vercel + HTTPS（通信は暗号化済み）
3. localStorageのみ保存（サーバーDBには保存しない）
4. 「ClaudeCoach専用の新しいAPIキーを作ることを推奨」
   と明示（万が一の時はそのキーだけ削除可能）
5. 「使用後に削除」ボタンを用意
```

---

## ディレクトリ構成

```
claudecoach/                        # 新リポジトリルート
├── messages/
│   ├── ja.json                     # 日本語テキスト
│   └── en.json                     # 英語テキスト
│
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                # トップ（ドロップ画面）
│   │   ├── dashboard/
│   │   │   └── page.tsx            # ダッシュボード
│   │   └── layout.tsx
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx              # 言語・プラン切り替えボタン含む
│   │   └── LangToggle.tsx          # 日英切り替え（右上固定）
│   │
│   ├── upload/
│   │   ├── DropZone.tsx            # ドラッグ&ドロップエリア
│   │   ├── FindFolder.tsx          # フォルダの見つけ方説明
│   │   └── ApiKeyInput.tsx         # APIキー入力・削除ボタン
│   │
│   ├── dashboard/
│   │   ├── SummaryCards.tsx        # 上部カード4枚【既存UIを維持】
│   │   ├── TokenChart.tsx          # グラフ【既存UIを維持】
│   │   ├── PeriodToggle.tsx        # 週次/月次切り替えボタン【既存UIを維持】
│   │   ├── PlanToggle.tsx          # プラン手動切り替えボタン【既存UIを維持】
│   │   ├── ProjectTable.tsx        # プロジェクト別コスト【既存UIを維持】
│   │   ├── MessageList.tsx         # メッセージ別トークン一覧
│   │   └── Suggestions.tsx         # 改善提案カード
│   │
│   └── ui/                         # shadcn/uiコンポーネント【既存流用】
│
├── lib/
│   ├── parser.ts                   # JSONLパース
│   ├── analyzer.ts                 # 分析ロジック
│   ├── rules.ts                    # ルールベース改善提案
│   ├── haiku.ts                    # Haiku API呼び出し
│   └── storage.ts                  # localStorage管理
│
└── types/
    └── index.ts                    # 型定義
```

---

## ヘッダーのUI仕様（既存UIを維持）

```
┌─────────────────────────────────────────────────┐
│ ClaudeCoach  [Pro][Max5x][Max20x][API]  [🌐 EN] │
│              ↑プラン切り替えボタン    ↑言語切替  │
└─────────────────────────────────────────────────┘
```

### プラン切り替えボタン
```typescript
// 自動検出した結果をデフォルトで選択した状態で表示
// ユーザーが手動で切り替え可能
// localStorageに保存

const PLANS = ['pro', 'max_5x', 'max_20x', 'api'] as const

// 自動検出ロジック（直近8日間の5時間ウィンドウ最大トークンから推定）
// < 50,000    → pro
// < 100,000   → max_5x
// < 250,000   → max_20x
// それ以上    → api
```

### 週次/月次切り替えボタン
```typescript
// ダッシュボード上部に配置（既存UIを維持）
// [週次 / 月次] トグルボタン
// グラフ・集計データが切り替わる
// localStorageに保存（次回アクセス時も維持）
```

### 言語切り替えボタン
```typescript
// 右上固定
// [🌐 日本語 / English]
// next-intlのlocaleを切り替え
// localStorageに保存
// デフォルト：ブラウザ言語を自動検出
```

---

## 型定義（types/index.ts）

```typescript
export type JsonlEntry = {
  type: string
  message?: {
    role: 'user' | 'assistant'
    content: Array<{
      type: 'text' | 'tool_use' | 'tool_result'
      text?: string
      name?: string
    }>
    usage?: {
      input_tokens: number
      output_tokens: number
      cache_read_input_tokens: number
      cache_creation_input_tokens: number
    }
  }
  timestamp?: string
  isSidechain?: boolean
  isApiErrorMessage?: boolean
}

export type MessageStat = {
  timestamp: string
  role: 'user' | 'assistant'
  promptText: string        // 先頭100文字のみ（改善提案生成に使用）
  promptLength: number      // 全体の文字数
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  model?: string
  toolCalls: string[]
  estimatedCost: number
}

export type SessionSummary = {
  sessionId: string
  projectName: string
  date: string
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCost: number
  messageCount: number
  durationMinutes: number
  messages: MessageStat[]
}

export type PlanType = 'pro' | 'max_5x' | 'max_20x' | 'api'
export type PeriodType = 'weekly' | 'monthly'
export type Locale = 'ja' | 'en'

export type PlanROI = {
  plan: PlanType
  planCost: number
  apiEquivalent: number
  roiRatio: number
  isProfitable: boolean
  message: string
}

export type DashboardData = {
  sessions: SessionSummary[]
  totalTokens: number
  totalCost: number
  planROI: PlanROI
  chartData: ChartData[]     // 週次または月次（periodTypeで切り替え）
  projectBreakdown: ProjectData[]
  patterns: Pattern[]
}

export type Suggestion = {
  type: 'rule' | 'ai'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  estimatedSaving: number
  example?: {
    before: string
    after: string
  }
}
```

---

## パーサー（lib/parser.ts）の仕様

```typescript
// JSONLパースの注意点：
// 1. isSidechain === true はスキップ（サブエージェント除外）
// 2. isApiErrorMessage === true はスキップ
// 3. message.usage がない行はスキップ
// 4. トークン数は累積値 → 差分計算が必要
//    （各メッセージのトークン = 現在値 - 前のメッセージの値）
// 5. プロジェクト名はファイルパスから抽出
//    例：-Users-hiroaki-finance-rag → finance-rag
// 6. 会話テキストはprompTextとして先頭100文字のみ保持
//    （改善提案生成用・外部送信なし）
```

---

## 分析エンジン（lib/analyzer.ts）の仕様

```typescript
// プラン自動検出
detectPlan(sessions): PlanType
// 直近8日間の5時間ウィンドウ最大トークンから推定

// ROI計算（プラン別）
calcROI(plan, apiEquivalent): PlanROI

// グラフデータ生成（週次/月次切り替え対応）
buildChartData(sessions, period: PeriodType): ChartData[]
// period === 'weekly'  → 直近7日間の日別データ
// period === 'monthly' → 直近30日間の日別データ

// プロジェクト別集計
buildProjectBreakdown(sessions): ProjectData[]

// パターン検出（メタデータのみ使用）
detectPatterns(sessions): Pattern[]
// 検出項目：
// - 長いプロンプト率（500文字超の割合）
// - 確認往復率（短い返信の連続）
// - セッション長すぎ（2時間超）
// - キャッシュヒット率
// - Opus多用率
// - 丁寧表現多用率（promptTextから検出）
```

---

## ルールベース改善提案（lib/rules.ts）

```typescript
// APIキーなしでも動作するルールベース提案
// メタデータとprompTextから生成

const RULES = [
  'long_prompt',        // プロンプト文字数 > 500
  'clarification_loop', // 短い往復が3回以上連続
  'low_cache',          // キャッシュヒット率 < 50%
  'opus_overuse',       // Opus使用率 > 70%
  'long_session',       // 平均セッション時間 > 120分
  'polite_words',       // 「よろしくお願いします」等の検出
]

// テキストはi18nから取得（日英対応）
```

---

## Haiku API呼び出し（lib/haiku.ts）

```typescript
export async function getAISuggestions(
  stats: AnalysisStats,
  samplePrompts: string[],  // 先頭100文字のみ・ブラウザ内完結
  apiKey: string,
  locale: Locale
): Promise<Suggestion[]> {

  if (!apiKey) return []

  const lang = locale === 'ja' ? '日本語' : 'English'

  const prompt = `
Analyze the following Claude Code usage statistics
and generate 3 improvement suggestions in ${lang}.

Statistics:
- Long prompt ratio: ${stats.longPromptRatio}%
- Clarification loop ratio: ${stats.clarificationRatio}%
- Cache hit rate: ${stats.cacheHitRate}%
- Opus usage ratio: ${stats.opusRatio}%
- Avg session duration: ${stats.avgSessionMinutes} min
- Polite expression ratio: ${stats.politeWordRatio}%

Sample prompts (first 100 chars each):
${samplePrompts.slice(0, 5).join('\n')}

Return JSON array only, no other text:
[{
  "title": "...",
  "description": "...",
  "before": "...",
  "after": "...",
  "estimatedSaving": 0
}]
`

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
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error(
      locale === 'ja' ? 'APIキーが無効です' : 'Invalid API key'
    )
    if (response.status === 429) throw new Error(
      locale === 'ja' ? 'レート制限に達しました' : 'Rate limit exceeded'
    )
    throw new Error(
      locale === 'ja' ? 'AI改善提案の取得に失敗しました' : 'Failed to get AI suggestions'
    )
  }

  const data = await response.json()
  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
```

---

## localStorage管理（lib/storage.ts）

```typescript
const KEYS = {
  API_KEY: 'claudecoach_api_key',
  LOCALE: 'claudecoach_locale',
  PLAN: 'claudecoach_plan',
  PERIOD: 'claudecoach_period',    // weekly | monthly
  LAST_ANALYSIS: 'claudecoach_last_analysis',
}

export const storage = {
  // APIキー
  getApiKey: () => localStorage.getItem(KEYS.API_KEY) ?? '',
  setApiKey: (key: string) => localStorage.setItem(KEYS.API_KEY, key),
  clearApiKey: () => localStorage.removeItem(KEYS.API_KEY),

  // 言語
  getLocale: (): Locale =>
    (localStorage.getItem(KEYS.LOCALE) as Locale) ?? 'ja',
  setLocale: (locale: Locale) =>
    localStorage.setItem(KEYS.LOCALE, locale),

  // プラン（手動設定）
  getPlan: (): PlanType | null =>
    localStorage.getItem(KEYS.PLAN) as PlanType | null,
  setPlan: (plan: PlanType) =>
    localStorage.setItem(KEYS.PLAN, plan),

  // 週次/月次
  getPeriod: (): PeriodType =>
    (localStorage.getItem(KEYS.PERIOD) as PeriodType) ?? 'weekly',
  setPeriod: (period: PeriodType) =>
    localStorage.setItem(KEYS.PERIOD, period),

  // 分析結果キャッシュ
  getLastAnalysis: (): DashboardData | null =>
    JSON.parse(localStorage.getItem(KEYS.LAST_ANALYSIS) ?? 'null'),
  setLastAnalysis: (data: DashboardData) =>
    localStorage.setItem(KEYS.LAST_ANALYSIS, JSON.stringify(data)),
}
```

---

## トップページのUI仕様

```
┌─────────────────────────────────────────────────┐
│ ClaudeCoach                        [🌐 English] │
├─────────────────────────────────────────────────┤
│                                                  │
│  Claude Codeの使い方を                           │
│  かんたんに分析できます                           │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ フォルダの見つけ方                          │  │
│  │                                            │  │
│  │ Macの場合：                                │  │
│  │  ① Finderを開く                           │  │
│  │  ② Command+Shift+. を押す（隠しフォルダ表示）│  │
│  │  ③ Command+G → ~/.claude/projects と入力  │  │
│  │                                            │  │
│  │ Windowsの場合：                            │  │
│  │  ① エクスプローラーを開く                  │  │
│  │  ② アドレスバーに貼り付け：               │  │
│  │     %USERPROFILE%\.claude\projects\       │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │                                            │  │
│  │   📂 フォルダをここにドロップ              │  │
│  │      または クリックして選択               │  │
│  │                                            │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  AI改善提案を使う（任意）                        │
│  Anthropic APIキー [___________________] 🗑️    │
│                                                  │
│  ※ キーはブラウザのみに保存。                   │
│    サーバーには送りません。                      │
│    ClaudeCoach専用の新しいキーの作成を推奨します。│
│  [APIキーの作り方 →]                            │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## ダッシュボードのUI仕様（既存UIを維持）

```
┌──────────────────────────────────────────────────────┐
│ ClaudeCoach  [Pro][Max5x][Max20x][API]  [🌐 English] │
│              [週次][月次]                             │
├──────────┬──────────┬──────────┬──────────────────────┤
│ 合計使用量 │かかった  │元取れてる？│節約できる額         │
│ 234万    │費用$7.02 │4.2倍✅   │$2.80               │
├──────────┴──────────┴──────────┴──────────────────────┤
│  トークン使用量グラフ（週次/月次切り替え対応）          │
├──────────────────────────────────────────────────────┤
│  改善提案                                             │
│  [ルールベース提案 2〜3個]                             │
│  [AI提案 3個]  ← APIキーなしはグレーアウト            │
│  「APIキーを入力するとAI改善提案が使えます」           │
├──────────────────────────────────────────────────────┤
│  メッセージ別使用量                                   │
│  時刻     やったこと（先頭50文字）  トークン数         │
│  10:00    コードを書いて...         2,400            │
├──────────────────────────────────────────────────────┤
│  作業別コスト                                         │
│  finance-rag   $3.21  ████████                      │
│  travel-rag    $2.10  █████                         │
└──────────────────────────────────────────────────────┘
```

---

## 多言語対応（next-intl）

### messages/ja.json（主要キーのみ）
```json
{
  "common": {
    "title": "ClaudeCoach",
    "lang_toggle": "English",
    "weekly": "週次",
    "monthly": "月次"
  },
  "plans": {
    "pro": "Pro",
    "max_5x": "Max 5x",
    "max_20x": "Max 20x",
    "api": "API",
    "auto_detected": "自動検出"
  },
  "upload": {
    "title": "フォルダをドロップしてください",
    "find_folder": "フォルダの見つけ方",
    "api_key_label": "Anthropic APIキー（任意）",
    "api_key_note": "キーはブラウザにのみ保存。サーバーには送りません。",
    "api_key_recommend": "ClaudeCoach専用の新しいキーの作成を推奨します。",
    "api_key_howto": "APIキーの作り方 →",
    "api_key_delete": "削除"
  },
  "dashboard": {
    "total_tokens": "合計使用量",
    "api_cost": "かかった費用",
    "roi": "元取れてる？",
    "saving": "節約できる額",
    "roi_good": "{{ratio}}倍 元取れてます ✅",
    "roi_bad": "あと${{amount}}で元が取れます",
    "suggestions": "改善提案",
    "suggestions_ai_locked": "APIキーを入力するとAI改善提案が使えます",
    "messages": "メッセージ別使用量",
    "projects": "作業別コスト"
  },
  "suggestions": {
    "long_prompt_title": "プロンプトが長すぎます",
    "long_prompt_desc": "500文字を超える指示が{{ratio}}%あります。箇条書きで簡潔に書くと節約できます",
    "clarification_title": "確認のやりとりが多いです",
    "clarification_desc": "短いやりとりの繰り返しを検出。最初から出力形式や制約を書くと往復が減ります",
    "low_cache_title": "キャッシュが効率よく使われていません",
    "low_cache_desc": "CLAUDE.mdの先頭に固定内容をまとめると改善します",
    "opus_overuse_title": "もっと安いモデルで十分な作業があります",
    "opus_overuse_desc": "単純な作業はSonnetで十分。月${{amount}}節約できます",
    "long_session_title": "作業時間が長すぎます",
    "long_session_desc": "2時間以上の連続作業が多い。途中で/compactを使うと効率が上がります",
    "polite_title": "不要な言葉が含まれています",
    "polite_desc": "「よろしくお願いします」などはトークンの無駄です。短く指示を出しましょう"
  }
}
```

---

## 実装優先順位

### Phase 1（Week 1）：基本動作
1. `types/index.ts` - 型定義
2. `lib/parser.ts` - JSONLパース・差分計算
3. `lib/analyzer.ts` - 集計・プラン自動検出
4. `lib/storage.ts` - localStorage管理
5. `messages/ja.json` `messages/en.json` - 翻訳ファイル
6. `components/layout/Header.tsx` - プラン切り替え・言語切り替え
7. トップページ - ドロップUI・フォルダ説明
8. ダッシュボード - カード4枚・グラフ（週次/月次切り替え）

### Phase 2（Week 2）：改善提案
9. `lib/rules.ts` - ルールベース改善提案
10. `lib/haiku.ts` - Haiku API呼び出し
11. APIキー入力UI・削除ボタン
12. 改善提案カード（ルールベース + AI）
13. メッセージ別使用量リスト

### Phase 3（Vercelデプロイ）
14. Vercelにデプロイ
15. OGP画像・メタタグ設定
16. README更新

---

## 注意事項（Claude Codeへの指示）

```
【変更禁止】
- ダッシュボードの全体レイアウト
- カード4枚のデザインと配置
- グラフのスタイル（Recharts）
- プロジェクト別コストの表示形式
- 週次/月次切り替えボタンの配置
- プラン切り替えボタンの配置
- 言語切り替えボタン（右上固定）

【プライバシー原則（絶対に守ること）】
- 会話の実テキストはサーバーに送らない
- APIキーはlocalStorageのみ・サーバーDBに保存しない
- Haiku APIはブラウザから直接呼び出す
  （anthropic-dangerous-direct-browser-access: true が必須）

【その他】
- FastAPI・Python・SQLiteは使わない（Next.jsのみ）
- AGPLライセンスのコードは使用しない
- 「Claude」商標の誤用に注意（公式ツールと誤解させない）
- Anthropic社との無関係を明示する
```

---

## 環境変数

```
# .env.local（Vercelの環境変数にも設定）
NEXT_PUBLIC_APP_URL=https://claudecoach.app

# APIキーはユーザーのlocalStorageに保存するため
# サーバー側の環境変数は不要
```

---

## Vercelデプロイ

```bash
# GitHubにpushするだけで自動デプロイ
# 環境変数：NEXT_PUBLIC_APP_URL のみ設定

# カスタムドメイン（任意）
# claudecoach.app などを取得してVercelに紐付け
```

