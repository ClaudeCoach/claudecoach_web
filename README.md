# ClaudeCoach Web

**Claude Code の使い方をブラウザだけで分析できるツール。**
インストール不要、会話の中身は外に出ません。

🔗 https://claudecoach-web.vercel.app/

---

## これは何？

Claude Code を使っていると、

- どのプロジェクトにいくら使ったのか
- Pro / Max プランで「元が取れているか」
- どこを直せば節約できるのか

が分からなくなりがちです。`~/.claude/projects` フォルダをドロップするだけで、それを可視化します。

## 特長

- **インストール不要** — URL を開いてフォルダをドロップするだけ
- **プライバシー完全保護** — JSONL のパース・集計はすべてブラウザ内で完結。会話本文や API キーをサーバーに送りません。気になるなら Wi-Fi を切った状態でもそのまま動きます
- **プラン自動判定** — 直近 8 日間の 5 時間ウィンドウ最大トークンから Pro / Max 5x / Max 20x / API を推定（手動切替も可）
- **週次 / 月次切替** — グラフと集計を切り替え
- **改善提案（ルールベース）** — プロンプト長・キャッシュヒット率・Opus 多用・確認往復・丁寧表現など 6 パターンを自動検出して優先度付きで提示。APIキー不要
- **改善提案（AI）** — Anthropic の Haiku にブラウザから直接問い合わせ、具体的な Before/After 付き提案を生成（APIキーはローカルのみ保存）。Light / Detailed の 2 モード切替
- **ベンチマーク** — 任意のオプトインで、自分の使い方を他ユーザーの平均と比較できます（送信されるのは 6 つの集計指標 + 期間内コストのみ）
- **メッセージ別の内訳** — プロジェクト名付き一覧、クリックで 200 文字プレビュー → 全文、コスト内訳（入力 / 出力 / キャッシュ読込・書込）を棒グラフで表示
- **X シェアボタン** — プラン別に ROI 文面を自動生成して 1 クリックで投稿
- **フィードバックページ** — 匿名で一行コメントを投げられます
- **日 / 英対応**

## 技術スタック

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts
- next-intl (ja / en)
- Anthropic Claude Haiku API（ブラウザ直叩き・APIキーはユーザーのローカルのみ）
- Upstash Redis（フィードバック保存のみ）
- Vercel ホスティング

バックエンドはフィードバック / ベンチマーク API（Redis）以外なし。分析処理・改善提案生成は完全にクライアントサイドです。

## プライバシー

ClaudeCoach の最優先設計原則は **「会話の内容はブラウザの外に出さない」** です。
ドロップした JSONL は、すべてあなたのブラウザ内で読み込み・解析・表示され、ClaudeCoach のサーバーにアップロードされることは一切ありません。
気になる場合は **Wi-Fi を切った状態でドロップしても動作します**。

### サーバーに送信される可能性があるもの（すべてオプトイン）

| 機能 | 送信先 | 内容 |
|---|---|---|
| AI 改善提案（任意） | api.anthropic.com（Anthropic のみ） | 集計指標 6 個 + サンプルプロンプト（Light: 100 字 × 5、Detailed: 500 字 × 5 + ツール内訳 + 確認返信実例） |
| ベンチマーク（任意） | ClaudeCoach (Upstash Redis) | 集計指標 6 個 + 期間内総コスト（USD）のみ。プロンプト本文・コード・プロジェクト名は送信されません |
| フィードバック（任意） | ClaudeCoach (Upstash Redis) | 入力したコメント本文のみ（匿名） |

詳細は [プライバシーポリシー](https://claudecoach-web.vercel.app/privacy) を参照してください。

## データの流れ

```
JSONL (~/.claude/projects/**/*.jsonl)
  ↓ parser.ts         ← ブラウザ内
SessionSummary[]
  ↓ analyzer.ts       ← ブラウザ内
DashboardData { patterns, turns, toolBreakdown, ... }
  ├─ rules.ts         → ルール提案（常時表示・ネットワーク不要）
  ├─ haiku.ts         → AI提案（ユーザー操作でのみ Anthropic API を呼ぶ）
  └─ /api/benchmark   → 集計指標のみ送信（オプトイン時のみ）
```

## ローカル開発

```bash
npm install
npm run dev
```

`http://localhost:3000` を開きます。

### 環境変数（任意）

フィードバック機能を動かす場合のみ `.env.local` に設定：

```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

Vercel + Upstash Marketplace 連携時はこれらが自動で注入されます。

## ライセンス

MIT

## Anthropic との関係

本ツールは Anthropic 社とは無関係の非公式ツールです。"Claude" は Anthropic 社の商標です。
