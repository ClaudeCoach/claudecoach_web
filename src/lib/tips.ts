export type UserStats = {
  avgSessionMinutes: number
  claudeMdLines: number
  opusRatio: number
  cacheHitRate: number
  clarificationRatio: number
  longPromptRatio: number
  politeWordRatio: number
  avgPromptLength: number
  subagentRatio: number
  thinkingTokenRatio: number
}

export type Tip = {
  id: string
  condition: {
    field: keyof UserStats
    operator: '>' | '<' | '>=' | '<='
    threshold: number
  }
  savingRate: number
  savingType: 'token' | 'cost'
  difficulty: 'easy' | 'medium' | 'hard'
  source: string
  sourceUrl?: string
  titleJa: string
  titleEn: string
  descriptionJa: string
  descriptionEn: string
  howToJa: string
  howToEn: string
}

export const TIPS_DATABASE: Tip[] = [
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

  {
    id: 'claudeignore',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 60 },
    savingRate: 0.30,
    savingType: 'token',
    difficulty: 'easy',
    source: '32blog: How I Reduced Claude Code Token Consumption by 50%',
    sourceUrl: 'https://32blog.com/en/claude-code/claude-code-token-cost-reduction-50-percent',
    titleJa: '.claudeignoreでファイル除外して30%削減',
    titleEn: 'Add .claudeignore to exclude files, save 30%',
    descriptionJa: 'node_modules・.next/・バイナリファイルをClaudeが読み込んでいます。.gitignoreと同じ要領で除外できます。単体で最も効果的な設定変更です。',
    descriptionEn: 'Claude reads node_modules, .next/, and binaries. Exclude them like .gitignore. This is the single biggest gain from a one-time setup change.',
    howToJa: 'プロジェクトルートに.claudeignoreを作成。node_modules/、.next/、dist/、*.lockファイルを追加するだけ。',
    howToEn: 'Create .claudeignore in project root. Add node_modules/, .next/, dist/, and *.lock files.',
  },

  {
    id: 'plan_mode',
    condition: { field: 'clarificationRatio', operator: '>', threshold: 0.15 },
    savingRate: 0.25,
    savingType: 'token',
    difficulty: 'easy',
    source: '32blog: How I Reduced Claude Code Token Consumption by 50%',
    sourceUrl: 'https://32blog.com/en/claude-code/claude-code-token-cost-reduction-50-percent',
    titleJa: 'Planモードで間違い実装を防いでトークンを25%削減',
    titleEn: 'Use Plan mode to prevent wrong implementations, save 25%',
    descriptionJa: '間違った方向で実装→やり直しのパターンが最もトークンを無駄にします。Planモードで先に方針を確認してから実装に入ると無駄な往復が激減します。',
    descriptionEn: 'Wrong implementation → redo cycles waste the most tokens. Plan mode confirms direction before execution, dramatically cutting back-and-forth.',
    howToJa: 'Shift+Tab でPlanモードを切り替え。複雑なタスクの時だけ使う。単純な1行修正には不要。',
    howToEn: 'Toggle Plan mode with Shift+Tab. Use only for complex tasks. Skip for simple one-line fixes.',
  },

  {
    id: 'mcp_reduction',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 60 },
    savingRate: 0.15,
    savingType: 'token',
    difficulty: 'medium',
    source: 'alexgreensh/token-optimizer・Claude Code公式ドキュメント',
    titleJa: '不要なMCPサーバーを無効化して15%削減',
    titleEn: 'Disable unused MCP servers to save 15%',
    descriptionJa: '接続中の全MCPサーバーのツール定義が毎メッセージのコンテキストに追加されます。使っていないサーバーでもツール定義は常に送られています。',
    descriptionEn: 'Every connected MCP server injects its tool definitions into every message context, even if you never call its tools.',
    howToJa: '/config でMCPサーバーの一覧を確認。今のタスクに不要なサーバーを無効化。プロジェクトごとに必要なサーバーだけ有効にする習慣をつける。',
    howToEn: 'Check MCP servers with /config. Disable servers not needed for current task. Develop habit of enabling only project-relevant servers.',
  },

  {
    id: 'caveman_mode',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 60 },
    savingRate: 0.65,
    savingType: 'token',
    difficulty: 'easy',
    source: 'Caveman Claude Code GitHub(5400 stars)・arXiv 2026 Brevity Constraints',
    sourceUrl: 'https://github.com/latentlabs/caveman-claude-code',
    titleJa: 'Caveman Modeで出力トークンを65%削減',
    titleEn: 'Enable Caveman Mode to cut output tokens by 65%',
    descriptionJa: 'Claudeの回答は「丁寧な説明」が多くを占めます。Caveman Modeは技術的な内容を保ちながら余分な説明を削除。2026年のarXiv論文では簡潔な回答が精度を26%向上させることも確認されています。',
    descriptionEn: 'Claude responses are full of polite explanations. Caveman Mode strips filler while keeping technical content. A 2026 arXiv paper found brevity constraints actually improved accuracy by 26%.',
    howToJa: 'Claude Code内で /caveman を入力するだけで有効化。Lite・Full・Ultraの3段階から選択可能。コード生成・ツール呼び出しには影響しない。',
    howToEn: 'Type /caveman in Claude Code to activate. Choose Lite/Full/Ultra intensity. Does not affect code generation or tool calls.',
  },

  {
    id: 'specific_file_path',
    condition: { field: 'avgPromptLength', operator: '<', threshold: 100 },
    savingRate: 0.50,
    savingType: 'token',
    difficulty: 'easy',
    source: 'DEV Community: 7 Ways to Cut Your Claude Code Token Usage',
    sourceUrl: 'https://dev.to/boucle2026/7-ways-to-cut-your-claude-code-token-usage-elb',
    titleJa: 'ファイルパスを明示して探索コストを50%削減',
    titleEn: 'Specify exact file paths to cut exploration costs by 50%',
    descriptionJa: '「認証フローのバグを直して」はClaudeがコードベース全体を探索します。「src/auth/validate.ts 42行目のJWT検証を直して」は直接ファイルに飛びます。同じタスクでトークン消費が10倍変わります。',
    descriptionEn: '"Fix the auth bug" makes Claude search the entire codebase. "Fix JWT validation in src/auth/validate.ts line 42" goes straight to the file. Same task, 10x different token usage.',
    howToJa: 'プロンプトにファイルパス・行番号・関数名を含める。「〜の機能に問題がある」→「src/xxx.ts の xxx関数の〜が問題」',
    howToEn: 'Include file path, line number, and function name in prompts. "Feature X is broken" → "Function Y in src/xxx.ts is broken because Z"',
  },

  {
    id: 'command_output_limit',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 90 },
    savingRate: 0.20,
    savingType: 'token',
    difficulty: 'medium',
    source: 'MindStudio: 18 Claude Code Token Management Hacks',
    sourceUrl: 'https://www.mindstudio.ai/blog/claude-code-token-management-hacks-3',
    titleJa: 'コマンド出力を制限してコンテキスト汚染を20%削減',
    titleEn: 'Limit command output to reduce context pollution by 20%',
    descriptionJa: 'git log・テスト結果・ビルドログなどの長い出力が全てコンテキストに入ります。200コミットのgit logや冗長なテスト結果が蓄積するとセッションが急速に肥大化します。',
    descriptionEn: 'git log, test results, and build logs all enter the context window in full. 200-commit git logs and verbose test output bloat sessions rapidly.',
    howToJa: 'Bashコマンドにパイプを追加：git log --oneline -20 | head -10、テストは対象モジュールだけ実行。PreToolUseフックでコマンド出力を自動truncateも可能。',
    howToEn: 'Pipe commands: git log --oneline -20 | head -10. Run tests for specific modules only. PreToolUse hooks can auto-truncate command output.',
  },

  {
    id: 'claude_md_tiered',
    condition: { field: 'claudeMdLines', operator: '>', threshold: 150 },
    savingRate: 0.62,
    savingType: 'token',
    difficulty: 'hard',
    source: 'Medium: Stop Wasting Tokens - How to Optimize Claude Code Context by 60%',
    titleJa: 'CLAUDE.mdを3層構造にしてコンテキストを62%削減',
    titleEn: 'Restructure CLAUDE.md into 3 tiers to cut context by 62%',
    descriptionJa: '全ての情報をCLAUDE.mdに書くと毎回全部読み込まれます。「常に必要な情報」「タスク別に必要な情報」「参照用ドキュメント」の3層に分けると劇的に削減できます。',
    descriptionEn: 'Everything in CLAUDE.md loads every time. Split into 3 tiers: always-needed, task-specific, and reference docs. Load only what each task requires.',
    howToJa: 'CLAUDE.md（200行以下）：常に必要なコアルールのみ。docs/フォルダ：タスク別の詳細ドキュメント。SessionStartフック：必要なdocsを動的に読み込む。',
    howToEn: 'CLAUDE.md (under 200 lines): core rules only. docs/ folder: task-specific docs. SessionStart hook: dynamically load relevant docs per task.',
  },

  {
    id: 'file_reread_prevention',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 60 },
    savingRate: 0.15,
    savingType: 'token',
    difficulty: 'medium',
    source: 'DEV Community: 7 Ways to Cut Your Claude Code Token Usage',
    titleJa: '同じファイルの重複読み込みを防いで15%削減',
    titleEn: 'Prevent duplicate file reads to save 15%',
    descriptionJa: 'Claude Codeは同じファイルをセッション内で複数回読み込みます。変更後の確認、関連ファイルの作業時など。毎回ファイル全体のトークンが消費されます。',
    descriptionEn: 'Claude Code re-reads the same files multiple times per session: after changes, when working on related files. Each read costs the full file token count.',
    howToJa: 'CLAUDE.mdに「一度読んだファイルは変更がない限り再読しない」と明記。キャッシュを活用するためにファイル構造をセッション開始時に一度だけ読ませる。',
    howToEn: 'Add "don\'t re-read files unless changed" to CLAUDE.md. Load file structure once at session start to leverage caching.',
  },

  {
    id: 'subagent_large_codebase',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 120 },
    savingRate: 0.82,
    savingType: 'token',
    difficulty: 'hard',
    source: 'Innovatrix: code-review-graph cuts Claude Code Token Usage by 49x',
    titleJa: '大規模ファイル調査をサブエージェントに委託して82%削減',
    titleEn: 'Delegate large codebase exploration to subagents, save 82%',
    descriptionJa: 'メインセッションで大量のファイルを読み込むとコンテキストが汚染されます。Taskツールでサブエージェントに委託するとサマリーだけがメインセッションに返り、調査コストが劇的に削減されます。',
    descriptionEn: 'Reading many files in the main session pollutes context. Delegating to Task tool subagents returns only a summary to the main session, dramatically cutting exploration cost.',
    howToJa: '3ファイル以上の調査はTaskツールで委託。「src/以下の認証関連ファイルを調査してサマリーを返して」のように指示。結果のサマリーだけがメインセッションに戻る。',
    howToEn: 'Delegate any exploration spanning 3+ files to Task tool. "Investigate auth-related files in src/ and return a summary." Only the summary returns to main session.',
  },

  {
    id: 'output_format_spec',
    condition: { field: 'longPromptRatio', operator: '<', threshold: 0.3 },
    savingRate: 0.30,
    savingType: 'token',
    difficulty: 'easy',
    source: 'Anthropic公式: Usage limit best practices',
    titleJa: '出力フォーマットを指定して出力トークンを30%削減',
    titleEn: 'Specify output format to cut output tokens by 30%',
    descriptionJa: 'Claudeはデフォルトで詳細な説明を付けて回答します。「差分だけ」「JSONで」「コードのみ」を指定すると出力トークンが大幅に削減されます。',
    descriptionEn: 'Claude defaults to detailed explanations. Specifying "diff only", "JSON format", or "code only" dramatically reduces output tokens.',
    howToJa: 'プロンプトの末尾に追加：「コードのみ返して（説明不要）」「変更差分だけ教えて」「JSONで返して」「1行で答えて」',
    howToEn: 'Add to end of prompt: "Code only, no explanation" / "Show diff only" / "Return as JSON" / "Answer in one line"',
  },

  {
    id: 'session_start_hook',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 60 },
    savingRate: 0.20,
    savingType: 'token',
    difficulty: 'hard',
    source: 'Medium: Stop Wasting Tokens - Optimize Claude Code Context by 60%',
    titleJa: 'SessionStartフックで動的コンテキスト注入、20%削減',
    titleEn: 'Use SessionStart hook for dynamic context injection, save 20%',
    descriptionJa: 'CLAUDE.mdに全情報を書く代わりに、SessionStartフックでその時点のgit状態・作業中のブランチ・最近のコミットなど必要な情報だけを動的に注入できます。',
    descriptionEn: 'Instead of putting everything in CLAUDE.md, SessionStart hooks can dynamically inject only what\'s needed: current git state, active branch, recent commits.',
    howToJa: '.claude/hooks/session-start.shを作成。git statusやgit log --oneline -5など現在の状態を出力する。CLAUDE.mdから動的な情報を削除して静的ルールのみに絞る。',
    howToEn: 'Create .claude/hooks/session-start.sh. Output current state: git status, git log --oneline -5. Remove dynamic info from CLAUDE.md, keep only static rules.',
  },
]
