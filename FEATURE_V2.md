# ClaudeCoach Web - 追加機能指示書 v2

## このドキュメントについて
既存リポジトリ（ClaudeCoach/claudecoach_web）に
以下の追加機能を実装するためのClaude Code向け指示書。

既存のコード・UIレイアウト・デザインは変更しないこと。
機能を追加する形で実装する。

---

## 実装する機能（優先順位順）

---

## 【Priority 1】Xシェアボタンの強化

### 現状
「MAXプランの4.2倍の元を取っています」という
シンプルな文面のみ

### 変更後
恥ずかしい数字・驚きの数字を含む
シェアしたくなる文面に変更する

### 実装仕様

```typescript
// lib/share.ts に追加

export function generateShareText(
  data: DashboardData,
  locale: Locale
): string {

  const roi = data.planROI
  const topPattern = data.patterns[0]  // 最も深刻な無駄パターン
  const politeCount = data.stats.politeWordCount  // 丁寧表現の回数
  const clarificationCount = data.stats.clarificationCount  // 確認往復回数

  if (locale === 'ja') {
    return `ClaudeCoachで自分のClaude使用量を分析したら衝撃的な事実が判明した🧵

・今月のAPI換算コスト：$${roi.apiEquivalent.toFixed(2)}
・${getPlanLabel(roi.plan)}ROI：${roi.roiRatio.toFixed(1)}倍${roi.isProfitable ? '✅' : '❌'}
・最も多かった無駄：${topPattern.titleJa}（月${topPattern.count}回）
${politeCount > 0 ? `・「よろしくお願いします」系を月${politeCount}回送っていた😇` : ''}

あなたはどう？（インストール不要・無料）
👇
claudecoach-web.vercel.app

#ClaudeCode #AI個人開発`
  } else {
    return `Analyzed my Claude Code usage with ClaudeCoach 🧵

・API-equivalent cost this month: $${roi.apiEquivalent.toFixed(2)}
・${getPlanLabel(roi.plan)} ROI: ${roi.roiRatio.toFixed(1)}x${roi.isProfitable ? ' ✅' : ' ❌'}
・Biggest waste: ${topPattern.titleEn} (${topPattern.count}x/month)
${politeCount > 0 ? `・Sent unnecessary filler phrases ${politeCount}x this month 😇` : ''}

What about you? (No install needed, free)
👇
claudecoach-web.vercel.app

#ClaudeCode #AItools`
  }
}
```

### UIの変更
```
既存のXシェアボタンの onClick を
上記の generateShareText() に差し替えるだけ
レイアウトは変更しない
```

---

## 【Priority 2】診断書画像のダウンロード

### 概要
分析結果を1枚の画像としてダウンロードできる機能。
SNSやnoteに貼りたくなるデザイン。

### 実装仕様

```typescript
// lib/downloadImage.ts（新規作成）
// html2canvas を使用してダッシュボードの
// サマリーカード部分をPNG画像として保存

import html2canvas from 'html2canvas'

export async function downloadDiagnosisImage(
  elementId: string,  // キャプチャするDOM要素のID
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) return

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,  // 高解像度
  })

  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
```

### 画像の内容（キャプチャ対象）
```
id="diagnosis-card" のDOM要素を新規作成する

┌──────────────────────────────────────┐
│  ClaudeCoach 使用診断書              │
│  2026年4月                           │
│                                      │
│  [プランバッジ: MAX 20x]             │
│                                      │
│  合計使用量    API換算コスト          │
│  234万tok     $7.02                  │
│                                      │
│  プランROI     節約余地              │
│  4.2倍 ✅     $2.80                 │
│                                      │
│  最大の無駄パターン：                 │
│  ⚡ 確認往復が多いです（月89回）      │
│                                      │
│  claudecoach-web.vercel.app          │
└──────────────────────────────────────┘
```

### UIの変更
```
ダッシュボードのサマリーカード付近に
「診断書をダウンロード 📥」ボタンを追加

日本語：「診断書をダウンロード」
英語：「Download Report」

既存のレイアウトを崩さないよう
Xシェアボタンの隣に配置する
```

### package.json への追加
```json
"html2canvas": "^1.4.1"
```

---

## 【Priority 3】CLAUDE.mdスコアカード

### 概要
ユーザーが自分のCLAUDE.mdをドロップまたは貼り付けると
スコアと改善提案を出す機能。
ダッシュボードとは独立したページとして実装する。

### 新規ページ
```
/claude-md-checker（新規ページ）
```

### UIレイアウト
```
┌──────────────────────────────────────────┐
│ CLAUDE.md チェッカー        [🌐 English] │
├──────────────────────────────────────────┤
│                                          │
│  CLAUDE.mdをここにドロップ               │
│  または テキストを貼り付け               │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  ここにCLAUDE.mdの内容を貼り付け  │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│  [分析する]                              │
│                                          │
│  ── 分析結果 ──                          │
│                                          │
│  総合スコア：42 / 100  ❌               │
│                                          │
│  ┌──────┬──────┬──────┬──────┐         │
│  │行数  │キャッシュ│重複 │構造 │         │
│  │234行 │23%   │多い │△   │         │
│  │❌   │❌    │❌   │△   │         │
│  └──────┴──────┴──────┴──────┘         │
│                                          │
│  問題点：                                │
│  ❌ 行数が多すぎます（推奨100行以下）    │
│  ❌ キャッシュに乗りにくい構造です       │
│  ❌ 毎回読み込まれる不要な内容があります │
│                                          │
│  [改善版をダウンロード 📥]               │
│  ※ AI改善提案（要APIキー）              │
│                                          │
└──────────────────────────────────────────┘
```

### 分析ロジック（lib/claudeMdAnalyzer.ts 新規作成）

```typescript
export type ClaudeMdScore = {
  total: number        // 0-100
  lineCount: number
  lineCountScore: number    // 100行以下で満点
  cacheScore: number        // 先頭に固定内容があるか
  duplicationScore: number  // 重複内容があるか
  structureScore: number    // セクション構造が適切か
  issues: Issue[]
  recommendations: Recommendation[]
}

export function analyzeClaudeMd(content: string): ClaudeMdScore {
  const lines = content.split('\n')
  const lineCount = lines.length

  // 1. 行数チェック（推奨100行以下）
  const lineCountScore = lineCount <= 100 ? 100
    : lineCount <= 200 ? 70
    : lineCount <= 300 ? 40
    : 10

  // 2. キャッシュ効率チェック
  // 先頭部分に変わらない固定内容があるか
  const firstSection = lines.slice(0, 20).join('\n')
  const hasDynamicContent = /\{\{|\$\{|today|現在|今日/.test(firstSection)
  const cacheScore = hasDynamicContent ? 30 : 80

  // 3. 重複チェック
  // 同じような指示が繰り返されていないか
  const duplicateScore = checkDuplication(lines)

  // 4. 構造チェック
  // セクションヘッダーがあるか
  const hasHeaders = lines.filter(l => l.startsWith('#')).length
  const structureScore = hasHeaders > 0 ? 80 : 40

  const total = Math.round(
    (lineCountScore * 0.3) +
    (cacheScore * 0.3) +
    (duplicateScore * 0.2) +
    (structureScore * 0.2)
  )

  return {
    total,
    lineCount,
    lineCountScore,
    cacheScore,
    duplicationScore: duplicateScore,
    structureScore,
    issues: generateIssues(lineCount, cacheScore, duplicateScore, structureScore),
    recommendations: generateRecommendations(lineCount, cacheScore)
  }
}

// AI改善版生成（APIキーある場合のみ）
export async function generateImprovedClaudeMd(
  content: string,
  score: ClaudeMdScore,
  apiKey: string,
  locale: Locale
): Promise<string> {
  if (!apiKey) throw new Error('API key required')

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
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `以下のCLAUDE.mdを最適化してください。

問題点：
${score.issues.map(i => `- ${i.description}`).join('\n')}

最適化の方針：
- 100行以内に削減
- キャッシュに乗りやすい構造（先頭に固定内容）
- 重複を削除
- 重要なルールだけ残す

元のCLAUDE.md：
${content}

改善版のCLAUDE.mdのみを返してください。説明は不要です。`
      }]
    })
  })

  const data = await response.json()
  return data.content[0].text
}
```

### ナビゲーションへの追加
```
既存のヘッダーまたはフッターに
「CLAUDE.md チェッカー」リンクを追加

日本語：「CLAUDE.md チェッカー」
英語：「CLAUDE.md Checker」
```

---

## 【Priority 4】トップページへの「サンプルデータで試す」ボタン

### 概要
JSONLファイルがなくてもデモを体験できる機能。
離脱率を下げる最も効果的な改善。

### 実装仕様
```typescript
// public/sample-data.jsonl（サンプルデータファイルを用意）
// 実際のJSONL形式だが架空のデータ

// components/upload/DropZone.tsx に追加

const handleSampleData = async () => {
  const response = await fetch('/sample-data.jsonl')
  const text = await response.text()
  // 通常のJSONL処理と同じフローに流す
  processJsonlText(text, 'sample-project')
}
```

### UIの変更
```
DropZoneの下に追加：

「JSONLファイルがない場合は→」
[サンプルデータで試してみる]

日本語：「サンプルデータで試してみる」
英語：「Try with sample data」
```

### サンプルデータの内容
```
・3プロジェクト・10セッション分の架空データ
・Pro/Max/APIの各プランで見せ場が出るデータ量
・無駄パターンが検出されるデータ（デモ映えする）
・実際のJSONL形式に準拠
```

---

## 実装しないもの（今回のスコープ外）

```
以下は今回実装しない：
・Stripe課金機能
・ユーザーアカウント管理
・月次メールレポート
・フック機能
・VSCode拡張
→ これらはサーバー構築後に実装する
```

---

## 実装順序

```
1. サンプルデータの作成（public/sample-data.jsonl）
2. 「サンプルデータで試す」ボタン（Priority 4）
   → 一番簡単で離脱率改善に即効性がある
3. Xシェアボタン強化（Priority 1）
   → 既存機能の改修なので工数が小さい
4. 診断書画像ダウンロード（Priority 2）
   → html2canvasの追加が必要
5. CLAUDE.mdスコアカード（Priority 3）
   → 新規ページなので最後
```

---

## 変更禁止事項

```
以下は変更しないこと：
・既存のダッシュボードレイアウト
・既存のカード4枚のデザイン
・既存のグラフスタイル
・既存のプライバシー設計
  （会話内容はブラウザ外に出さない）
・既存の言語切り替え・プラン切り替えの動作
```

