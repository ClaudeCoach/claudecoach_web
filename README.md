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
- **プライバシー完全保護** — JSONL のパース・集計はすべてブラウザ内で完結。会話本文や API キーをサーバーに送りません
- **プラン自動判定** — 直近 8 日間の 5 時間ウィンドウ最大トークンから Pro / Max 5x / Max 20x / API を推定（手動切替も可）
- **週次 / 月次切替** — グラフと集計を切り替え
- **メッセージ別の内訳** — クリックで展開、コスト内訳（入力 / 出力 / キャッシュ読込・書込）まで確認可能
- **X シェアボタン** — ROI を 1 クリックで投稿
- **フィードバックページ** — 匿名で一行コメントを投げられます
- **日 / 英対応**

## 技術スタック

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts
- next-intl (ja / en)
- Upstash Redis（フィードバック保存のみ）
- Vercel ホスティング

バックエンドはフィードバック API（Redis）以外なし。分析処理は完全にクライアントサイドです。

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
