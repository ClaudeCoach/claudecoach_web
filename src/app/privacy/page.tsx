"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n-provider";

export default function PrivacyPage() {
  const { locale } = useLocale();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="mr-1">{"//"}</span>
              {locale === "ja" ? "プライバシーポリシー" : "Privacy Policy"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            {locale === "ja" ? <Ja /> : <En />}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-muted-foreground space-y-2">{children}</div>
    </section>
  );
}

function Ja() {
  return (
    <>
      <p className="text-muted-foreground">
        最終更新: 2026-04-13
      </p>

      <Section title="基本方針">
        <p>
          ClaudeCoach は <strong>「会話の内容はブラウザの外に出さない」</strong>{" "}
          を最優先の設計原則として作られています。あなたが
          ドロップした <code>~/.claude/projects</code>{" "}
          フォルダのJSONLファイルは、すべてあなたのブラウザ内で読み込み・解析・表示されます。
          サーバー（Vercel / Upstash / その他）にアップロードされることは一切ありません。
          疑わしい場合は Wi-Fi
          を切った状態でドロップしても動作することで確認できます。
        </p>
      </Section>

      <Section title="ブラウザ内だけで処理されるもの">
        <ul className="list-disc list-inside space-y-1">
          <li>JSONL ファイルの内容（プロンプト本文、コード、ツール呼び出し）</li>
          <li>プロジェクト名・ファイルパス</li>
          <li>あなたの Anthropic API キー（localStorage のみ・サーバー DB なし）</li>
        </ul>
      </Section>

      <Section title="サーバーに送信される可能性があるもの">
        <p>以下の3つの機能を <strong>あなたが明示的に操作した場合のみ</strong> 通信が発生します。</p>

        <div className="rounded-md border border-border bg-background/40 p-3">
          <h3 className="font-semibold text-foreground mb-1">
            1. AI改善提案（任意・APIキー入力時のみ）
          </h3>
          <p>
            「AI提案を生成」ボタンを押したときだけ、Anthropic API
            (api.anthropic.com) にブラウザから直接リクエストが送られます。
            送信先は <strong>Anthropic 社のみ</strong> であり、
            ClaudeCoach のサーバーは経由しません。
          </p>
          <p className="mt-2">送信される内容:</p>
          <ul className="list-disc list-inside ml-2">
            <li>6 つの集計指標（プロンプト長率・キャッシュヒット率など）</li>
            <li>
              <strong>Light モード</strong>: プロンプト先頭 100 文字 × 5 件
            </li>
            <li>
              <strong>Detailed モード</strong>: 上記 + 高コストターン Top 5（プロンプト先頭
              500 文字・コスト・トークン数・プロジェクト名）+ ツール別コスト内訳 +
              短い確認返信の実例 5 件
            </li>
          </ul>
        </div>

        <div className="rounded-md border border-border bg-background/40 p-3">
          <h3 className="font-semibold text-foreground mb-1">
            2. ベンチマーク機能（任意・参加ボタンを押した時のみ）
          </h3>
          <p>
            「ベンチマークに参加する」ボタンを押した時のみ、ClaudeCoach
            サーバー (Upstash Redis) に <strong>集計値だけ</strong>{" "}
            が送信されます。
          </p>
          <p className="mt-2">送信される内容:</p>
          <ul className="list-disc list-inside ml-2">
            <li>長文プロンプト率 (0-1)</li>
            <li>確認往復率 (0-1)</li>
            <li>キャッシュヒット率 (0-1)</li>
            <li>Opus 使用率 (0-1)</li>
            <li>平均セッション時間 (分)</li>
            <li>丁寧表現率 (0-1)</li>
            <li>期間内の総コスト (USD)</li>
          </ul>
          <p className="mt-2">
            <strong>送信されないもの</strong>:
            プロンプト本文、コード、プロジェクト名、ファイルパス、ユーザー識別子、IP
            アドレス（保存しません）、APIキー。
          </p>
          <p className="mt-2">
            送信されたデータは平均値の計算にのみ使われ、ハッシュキー{" "}
            <code>benchmark:v1</code> に各指標の合計値とサンプル数として加算されます。
            個別のレコードは保持されません。
          </p>
        </div>

        <div className="rounded-md border border-border bg-background/40 p-3">
          <h3 className="font-semibold text-foreground mb-1">
            3. フィードバック機能（任意・送信ボタンを押した時のみ）
          </h3>
          <p>
            「/feedback」ページで送信ボタンを押した時のみ、入力したコメント文が
            ClaudeCoach サーバー (Upstash Redis) に保存されます。
            匿名で送信されます（名前・メールアドレスは収集しません）。
          </p>
        </div>
      </Section>

      <Section title="Cookie・トラッキング">
        <p>
          ClaudeCoach は Cookie を一切使用していません。Google Analytics
          などの外部トラッキングツールも導入していません。
        </p>
        <p>
          設定（言語・プラン・期間・APIキー・ベンチマーク参加状態）は
          ブラウザの localStorage に保存されますが、これは
          ブラウザ内の情報であり、サーバーには送信されません。
        </p>
      </Section>

      <Section title="ホスティング">
        <p>
          このサイトは Vercel (静的サイト) でホスティングされ、
          フィードバック機能とベンチマーク機能のデータは
          Upstash Redis に保存されています。
          ソースコードは{" "}
          <a
            href="https://github.com/ClaudeCoach/claudecoach_web"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            GitHub (ClaudeCoach/claudecoach_web)
          </a>{" "}
          で公開されており、誰でも検証できます。
        </p>
      </Section>

      <Section title="連絡先">
        <p>
          質問・要望は{" "}
          <a href="/feedback" className="text-primary underline">
            フィードバックページ
          </a>{" "}
          または GitHub の issue でお寄せください。
        </p>
      </Section>
    </>
  );
}

function En() {
  return (
    <>
      <p className="text-muted-foreground">Last updated: 2026-04-13</p>

      <Section title="Core principle">
        <p>
          ClaudeCoach is built on a single rule:{" "}
          <strong>your conversation content never leaves your browser.</strong>{" "}
          The JSONL files you drop from <code>~/.claude/projects</code> are
          read, parsed, and analyzed entirely client-side. They are never
          uploaded to Vercel, Upstash, or any other server. If you&apos;re skeptical,
          you can verify by turning off Wi-Fi before dropping the folder — the
          page still works.
        </p>
      </Section>

      <Section title="Processed only in your browser">
        <ul className="list-disc list-inside space-y-1">
          <li>JSONL contents (prompt text, code, tool calls)</li>
          <li>Project names and file paths</li>
          <li>Your Anthropic API key (localStorage only, never on our server)</li>
        </ul>
      </Section>

      <Section title="What may be sent over the network">
        <p>
          Network requests only happen when{" "}
          <strong>you explicitly click one of these features</strong>.
        </p>

        <div className="rounded-md border border-border bg-background/40 p-3">
          <h3 className="font-semibold text-foreground mb-1">
            1. AI suggestions (optional, requires your API key)
          </h3>
          <p>
            When you click &quot;Generate AI suggestions&quot;, a request is sent
            directly from your browser to Anthropic&apos;s API
            (api.anthropic.com). The request goes{" "}
            <strong>only to Anthropic</strong>, not through ClaudeCoach
            servers.
          </p>
          <p className="mt-2">Sent payload:</p>
          <ul className="list-disc list-inside ml-2">
            <li>6 aggregate ratios</li>
            <li>
              <strong>Light mode</strong>: 5 prompts × 100 chars each
            </li>
            <li>
              <strong>Detailed mode</strong>: above + Top 5 expensive turns
              (prompt 500 chars, cost, tokens, project name) + tool cost
              breakdown + 5 short clarification reply samples
            </li>
          </ul>
        </div>

        <div className="rounded-md border border-border bg-background/40 p-3">
          <h3 className="font-semibold text-foreground mb-1">
            2. Benchmark feature (optional, opt-in button)
          </h3>
          <p>
            When you click &quot;Join the benchmark&quot;, only{" "}
            <strong>aggregate values</strong> are sent to the ClaudeCoach
            server (Upstash Redis):
          </p>
          <ul className="list-disc list-inside ml-2">
            <li>Long prompt ratio (0-1)</li>
            <li>Clarification loop ratio (0-1)</li>
            <li>Cache hit rate (0-1)</li>
            <li>Opus usage ratio (0-1)</li>
            <li>Average session duration (minutes)</li>
            <li>Polite phrase ratio (0-1)</li>
            <li>Period total cost (USD)</li>
          </ul>
          <p className="mt-2">
            <strong>Not sent</strong>: prompt text, code, project names, file
            paths, user identifiers, IP addresses (we don&apos;t store them), API
            keys.
          </p>
          <p className="mt-2">
            The submitted values are accumulated into a single hash key{" "}
            <code>benchmark:v1</code> as running sums and a sample count. No
            individual records are retained.
          </p>
        </div>

        <div className="rounded-md border border-border bg-background/40 p-3">
          <h3 className="font-semibold text-foreground mb-1">
            3. Feedback feature (optional, send button)
          </h3>
          <p>
            When you press send on the /feedback page, your comment text is
            stored in the ClaudeCoach server (Upstash Redis) anonymously.
            We don&apos;t collect your name, email, or any identifiers.
          </p>
        </div>
      </Section>

      <Section title="Cookies & tracking">
        <p>
          ClaudeCoach uses no cookies. There is no Google Analytics or any
          other third-party tracking.
        </p>
        <p>
          Settings (language, plan, period, API key, benchmark opt-in) are
          stored in browser localStorage only — they never leave your device.
        </p>
      </Section>

      <Section title="Hosting">
        <p>
          The site is hosted on Vercel (static), and the feedback and
          benchmark features use Upstash Redis. The source code is open at{" "}
          <a
            href="https://github.com/ClaudeCoach/claudecoach_web"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            GitHub (ClaudeCoach/claudecoach_web)
          </a>{" "}
          — you can verify everything yourself.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Send questions or requests via the{" "}
          <a href="/feedback" className="text-primary underline">
            feedback page
          </a>{" "}
          or open an issue on GitHub.
        </p>
      </Section>
    </>
  );
}
