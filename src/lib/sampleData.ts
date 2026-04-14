import type { DroppedFile } from "./parser";

type Msg =
  | { role: "user"; text: string; tsOffsetMin: number }
  | {
      role: "assistant";
      text: string;
      model: string;
      tsOffsetMin: number;
      input: number;
      output: number;
      cacheRead: number;
      cacheCreate: number;
      tools?: string[];
    };

type SessionSpec = {
  project: string;
  sessionId: string;
  daysAgo: number;
  startHour: number;
  messages: Msg[];
};

const OPUS = "claude-opus-4-5";
const SONNET = "claude-sonnet-4-5";
const HAIKU = "claude-haiku-4-5";

const LONG_PROMPT_JA =
  "このプロジェクトのユーザー認証周りをリファクタリングしたいです。現状はログイン処理とセッション管理がバラバラに書かれていて、パスワードリセットのフローも重複している気がします。まずは全体の構造を把握した上で、どこを統合すべきか、どこを分離すべきかを整理してください。テストも壊れないように注意しつつ、既存のAPI互換性は維持したままで進めてほしいです。よろしくお願いします。";

const LONG_PROMPT_EN =
  "I want to refactor the authentication layer in this project. Login handling, session management and the password reset flow all feel duplicated across several files. Please survey the current structure, figure out what should be unified and what should stay separated, keep the existing API contract stable, and make sure none of the tests break while we're at it. Thanks in advance!";

function buildSessions(): SessionSpec[] {
  return [
    // finance-rag: heavy usage with long prompts + polite + opus overuse
    {
      project: "finance-rag",
      sessionId: "sess-fin-001",
      daysAgo: 2,
      startHour: 10,
      messages: [
        { role: "user", text: LONG_PROMPT_JA, tsOffsetMin: 0 },
        {
          role: "assistant",
          text: "承知しました。まず構造を調べます。",
          model: OPUS,
          tsOffsetMin: 1,
          input: 2800,
          output: 1200,
          cacheRead: 18000,
          cacheCreate: 4200,
          tools: ["Read", "Grep"],
        },
        {
          role: "user",
          text: "続けてください。よろしくお願いします。",
          tsOffsetMin: 4,
        },
        {
          role: "assistant",
          text: "auth/login.ts と auth/session.ts を統合できそうです。",
          model: OPUS,
          tsOffsetMin: 5,
          input: 3100,
          output: 1800,
          cacheRead: 22000,
          cacheCreate: 1500,
          tools: ["Read", "Edit"],
        },
        {
          role: "user",
          text: "ありがとうございます。テストも直してください。",
          tsOffsetMin: 9,
        },
        {
          role: "assistant",
          text: "テストを更新しました。",
          model: OPUS,
          tsOffsetMin: 12,
          input: 3400,
          output: 2400,
          cacheRead: 25000,
          cacheCreate: 800,
          tools: ["Edit", "Bash"],
        },
      ],
    },
    {
      project: "finance-rag",
      sessionId: "sess-fin-002",
      daysAgo: 4,
      startHour: 14,
      messages: [
        {
          role: "user",
          text:
            "チャート描画のコンポーネントでパフォーマンスが悪いので調査してほしいです。特に大量データを渡したときに固まる問題があります。Rechartsを使っていますが、もしかして他のライブラリの方が良いのでしょうか？判断材料を整理してください。",
          tsOffsetMin: 0,
        },
        {
          role: "assistant",
          text: "計測します。",
          model: OPUS,
          tsOffsetMin: 2,
          input: 4100,
          output: 2800,
          cacheRead: 32000,
          cacheCreate: 2100,
          tools: ["Read", "Grep", "Bash"],
        },
        { role: "user", text: "OK", tsOffsetMin: 8 },
        {
          role: "assistant",
          text: "Memoization が抜けていました。",
          model: OPUS,
          tsOffsetMin: 9,
          input: 4500,
          output: 1500,
          cacheRead: 28000,
          cacheCreate: 500,
          tools: ["Edit"],
        },
        { role: "user", text: "次は？", tsOffsetMin: 12 },
        {
          role: "assistant",
          text: "仮想スクロールを入れます。",
          model: OPUS,
          tsOffsetMin: 13,
          input: 4800,
          output: 2200,
          cacheRead: 30000,
          cacheCreate: 900,
          tools: ["Edit", "Bash"],
        },
        { role: "user", text: "動かない", tsOffsetMin: 18 },
        {
          role: "assistant",
          text: "修正します。",
          model: OPUS,
          tsOffsetMin: 19,
          input: 5100,
          output: 1100,
          cacheRead: 34000,
          cacheCreate: 300,
          tools: ["Edit"],
        },
      ],
    },
    {
      project: "finance-rag",
      sessionId: "sess-fin-003",
      daysAgo: 6,
      startHour: 9,
      messages: [
        {
          role: "user",
          text:
            "昨日のチャート修正を本番デプロイ前に動作確認したい。リグレッションテストの観点で、どのケースを通せば安心できるか洗い出してください。",
          tsOffsetMin: 0,
        },
        {
          role: "assistant",
          text: "テストケースを列挙します。",
          model: OPUS,
          tsOffsetMin: 2,
          input: 3800,
          output: 3200,
          cacheRead: 24000,
          cacheCreate: 1400,
          tools: ["Read", "Bash"],
        },
        {
          role: "user",
          text: "ありがとうございます。CIも通しておいてください。",
          tsOffsetMin: 135,
        },
        {
          role: "assistant",
          text: "CIが通りました。",
          model: OPUS,
          tsOffsetMin: 145,
          input: 2400,
          output: 800,
          cacheRead: 19000,
          cacheCreate: 200,
          tools: ["Bash"],
        },
      ],
    },
    // travel-app: clarification loops + bash heavy
    {
      project: "travel-app",
      sessionId: "sess-trv-001",
      daysAgo: 1,
      startHour: 20,
      messages: [
        {
          role: "user",
          text: "予約フォームのバリデーション追加して",
          tsOffsetMin: 0,
        },
        {
          role: "assistant",
          text: "どのフィールドですか？",
          model: SONNET,
          tsOffsetMin: 1,
          input: 1200,
          output: 400,
          cacheRead: 8000,
          cacheCreate: 600,
          tools: ["Read"],
        },
        { role: "user", text: "全部", tsOffsetMin: 2 },
        {
          role: "assistant",
          text: "追加しました。",
          model: SONNET,
          tsOffsetMin: 3,
          input: 1500,
          output: 1100,
          cacheRead: 9000,
          cacheCreate: 400,
          tools: ["Edit"],
        },
        { role: "user", text: "動かない", tsOffsetMin: 4 },
        { role: "user", text: "エラー出てる", tsOffsetMin: 5 },
        { role: "user", text: "直して", tsOffsetMin: 6 },
        {
          role: "assistant",
          text: "ログを確認します。",
          model: SONNET,
          tsOffsetMin: 7,
          input: 1800,
          output: 600,
          cacheRead: 11000,
          cacheCreate: 300,
          tools: ["Bash", "Bash", "Bash"],
        },
        { role: "user", text: "まだダメ", tsOffsetMin: 9 },
        { role: "user", text: "なぜ？", tsOffsetMin: 10 },
        { role: "user", text: "もう一度", tsOffsetMin: 11 },
        {
          role: "assistant",
          text: "依存関係の問題でした。",
          model: SONNET,
          tsOffsetMin: 12,
          input: 2100,
          output: 800,
          cacheRead: 12000,
          cacheCreate: 200,
          tools: ["Bash", "Edit", "Bash"],
        },
      ],
    },
    {
      project: "travel-app",
      sessionId: "sess-trv-002",
      daysAgo: 3,
      startHour: 16,
      messages: [
        {
          role: "user",
          text: "google maps を組み込みたい",
          tsOffsetMin: 0,
        },
        {
          role: "assistant",
          text: "APIキーの取得方法から説明します。",
          model: SONNET,
          tsOffsetMin: 1,
          input: 2200,
          output: 1600,
          cacheRead: 7000,
          cacheCreate: 900,
          tools: ["Read"],
        },
        { role: "user", text: "done", tsOffsetMin: 8 },
        {
          role: "assistant",
          text: "マップコンポーネントを追加しました。",
          model: SONNET,
          tsOffsetMin: 10,
          input: 2500,
          output: 2000,
          cacheRead: 9500,
          cacheCreate: 700,
          tools: ["Edit"],
        },
        { role: "user", text: "テストして", tsOffsetMin: 14 },
        {
          role: "assistant",
          text: "テストをパスしました。",
          model: SONNET,
          tsOffsetMin: 16,
          input: 2800,
          output: 900,
          cacheRead: 10000,
          cacheCreate: 300,
          tools: ["Bash", "Bash"],
        },
      ],
    },
    {
      project: "travel-app",
      sessionId: "sess-trv-003",
      daysAgo: 5,
      startHour: 11,
      messages: [
        {
          role: "user",
          text:
            "予約一覧ページのページネーションが壊れています。ページ2以降で空になるようです。原因を調べて直してください。再現手順は README に書いてあります。",
          tsOffsetMin: 0,
        },
        {
          role: "assistant",
          text: "再現しました。offset の計算ミスです。",
          model: SONNET,
          tsOffsetMin: 3,
          input: 3200,
          output: 1800,
          cacheRead: 14000,
          cacheCreate: 1100,
          tools: ["Read", "Bash"],
        },
        {
          role: "user",
          text: "ありがとうございます。修正PR作ってください。",
          tsOffsetMin: 7,
        },
        {
          role: "assistant",
          text: "PRを作成しました。",
          model: SONNET,
          tsOffsetMin: 9,
          input: 2900,
          output: 1500,
          cacheRead: 13500,
          cacheCreate: 500,
          tools: ["Edit", "Bash"],
        },
      ],
    },
    // blog-site: smaller Haiku project
    {
      project: "blog-site",
      sessionId: "sess-blog-001",
      daysAgo: 7,
      startHour: 19,
      messages: [
        {
          role: "user",
          text: "記事一覧のタイトルを大きくしたい",
          tsOffsetMin: 0,
        },
        {
          role: "assistant",
          text: "Tailwind のクラスを text-2xl に変更します。",
          model: HAIKU,
          tsOffsetMin: 1,
          input: 900,
          output: 350,
          cacheRead: 5200,
          cacheCreate: 400,
          tools: ["Edit"],
        },
        { role: "user", text: "太字にもしたい", tsOffsetMin: 3 },
        {
          role: "assistant",
          text: "font-bold を追加しました。",
          model: HAIKU,
          tsOffsetMin: 4,
          input: 1100,
          output: 200,
          cacheRead: 5800,
          cacheCreate: 150,
          tools: ["Edit"],
        },
      ],
    },
    {
      project: "blog-site",
      sessionId: "sess-blog-002",
      daysAgo: 9,
      startHour: 22,
      messages: [
        {
          role: "user",
          text: "RSS フィードを生成する機能を追加してください。",
          tsOffsetMin: 0,
        },
        {
          role: "assistant",
          text: "rss ライブラリを追加します。",
          model: HAIKU,
          tsOffsetMin: 2,
          input: 1400,
          output: 1200,
          cacheRead: 6500,
          cacheCreate: 700,
          tools: ["Edit", "Bash"],
        },
        {
          role: "user",
          text: "/feed.xml で配信したい",
          tsOffsetMin: 6,
        },
        {
          role: "assistant",
          text: "ルートを追加しました。",
          model: HAIKU,
          tsOffsetMin: 8,
          input: 1700,
          output: 900,
          cacheRead: 7000,
          cacheCreate: 300,
          tools: ["Edit"],
        },
      ],
    },
    {
      project: "blog-site",
      sessionId: "sess-blog-003",
      daysAgo: 12,
      startHour: 8,
      messages: [
        {
          role: "user",
          text: LONG_PROMPT_EN,
          tsOffsetMin: 0,
        },
        {
          role: "assistant",
          text: "I'll start by scanning the auth modules.",
          model: SONNET,
          tsOffsetMin: 2,
          input: 2400,
          output: 1900,
          cacheRead: 11000,
          cacheCreate: 1200,
          tools: ["Read", "Grep"],
        },
        { role: "user", text: "thanks, please continue", tsOffsetMin: 6 },
        {
          role: "assistant",
          text: "Consolidated session handling into a single module.",
          model: SONNET,
          tsOffsetMin: 9,
          input: 2800,
          output: 2100,
          cacheRead: 12500,
          cacheCreate: 500,
          tools: ["Edit"],
        },
      ],
    },
    {
      project: "finance-rag",
      sessionId: "sess-fin-004",
      daysAgo: 13,
      startHour: 15,
      messages: [
        {
          role: "user",
          text:
            "CSV 出力機能を追加したいです。列は日付、カテゴリ、金額、メモの4つ。Shift-JIS にも対応する必要があります。既存の JSON 出力と同じ整形ロジックを使いまわせるはずです。",
          tsOffsetMin: 0,
        },
        {
          role: "assistant",
          text: "export/csv.ts を追加します。",
          model: OPUS,
          tsOffsetMin: 2,
          input: 3600,
          output: 2600,
          cacheRead: 20000,
          cacheCreate: 1800,
          tools: ["Read", "Edit"],
        },
        {
          role: "user",
          text: "Shift-JIS の部分もお願いします。",
          tsOffsetMin: 6,
        },
        {
          role: "assistant",
          text: "iconv-lite を追加してエンコードします。",
          model: OPUS,
          tsOffsetMin: 8,
          input: 3900,
          output: 2000,
          cacheRead: 21500,
          cacheCreate: 600,
          tools: ["Edit", "Bash"],
        },
      ],
    },
  ];
}

function toDroppedFile(spec: SessionSpec): DroppedFile {
  const base = new Date();
  base.setDate(base.getDate() - spec.daysAgo);
  base.setHours(spec.startHour, 0, 0, 0);

  const lines: string[] = [];
  for (const m of spec.messages) {
    const ts = new Date(base.getTime() + m.tsOffsetMin * 60_000).toISOString();
    if (m.role === "user") {
      lines.push(
        JSON.stringify({
          type: "user",
          timestamp: ts,
          message: {
            role: "user",
            content: [{ type: "text", text: m.text }],
          },
        })
      );
    } else {
      const content: Array<Record<string, unknown>> = [
        { type: "text", text: m.text },
      ];
      for (const tool of m.tools ?? []) {
        content.push({ type: "tool_use", name: tool });
      }
      lines.push(
        JSON.stringify({
          type: "assistant",
          timestamp: ts,
          message: {
            role: "assistant",
            model: m.model,
            content,
            usage: {
              input_tokens: m.input,
              output_tokens: m.output,
              cache_read_input_tokens: m.cacheRead,
              cache_creation_input_tokens: m.cacheCreate,
            },
          },
        })
      );
    }
  }

  return {
    path: `-Users-demo-${spec.project}/${spec.sessionId}.jsonl`,
    content: lines.join("\n"),
  };
}

export function buildSampleDroppedFiles(): DroppedFile[] {
  return buildSessions().map(toDroppedFile);
}
