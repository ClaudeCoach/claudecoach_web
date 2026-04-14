# ClaudeCoach - 追加Tipsデータベース

## FEATURE_TIPS.mdのTIPS_DATABASEに追加するtips

既存の9件に以下を追加する。
src/lib/tips.ts の TIPS_DATABASE 配列に追記すること。

---

```typescript
  // ⑥ .claudeignoreによるファイル除外
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

  // ⑦ Planモードの活用
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

  // ⑧ MCPサーバー数の削減
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

  // ⑨ Caveman Mode（出力トークン削減）
  {
    id: 'caveman_mode',
    condition: { field: 'avgSessionMinutes', operator: '>', threshold: 60 },
    savingRate: 0.65,
    savingType: 'token',
    difficulty: 'easy',
    source: 'Caveman Claude Code GitHub（5400スター）・arXiv 2026 Brevity Constraints',
    sourceUrl: 'https://github.com/latentlabs/caveman-claude-code',
    titleJa: 'Caveman Modeで出力トークンを65%削減',
    titleEn: 'Enable Caveman Mode to cut output tokens by 65%',
    descriptionJa: 'Claudeの回答は「丁寧な説明」が多くを占めます。Caveman Modeは技術的な内容を保ちながら余分な説明を削除。2026年のarXiv論文では簡潔な回答が精度を26%向上させることも確認されています。',
    descriptionEn: 'Claude responses are full of polite explanations. Caveman Mode strips filler while keeping technical content. A 2026 arXiv paper found brevity constraints actually improved accuracy by 26%.',
    howToJa: 'Claude Code内で /caveman を入力するだけで有効化。Lite・Full・Ultraの3段階から選択可能。コード生成・ツール呼び出しには影響しない。',
    howToEn: 'Type /caveman in Claude Code to activate. Choose Lite/Full/Ultra intensity. Does not affect code generation or tool calls.',
  },

  // ⑩ 具体的なファイルパスを指定する
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

  // ⑪ コマンド出力の制限
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

  // ⑫ CLAUDE.mdの3層構造
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

  // ⑬ 同じファイルの重複読み込みを防ぐ
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

  // ⑭ サブエージェントで調査を分離（大規模コードベース向け）
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

  // ⑮ 出力フォーマットの指定
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

  // ⑯ SessionStartフックでコンテキスト注入
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
```

---

## 削減率の根拠まとめ

| tips ID | 削減率 | 出典 |
|---|---|---|
| compact_timing | 35% | zenn実測値 |
| session_task_split | 30% | note記事 |
| opus_to_sonnet | 60% | Anthropic公式料金比較 |
| thinking_tokens | 70% | zenn記事 |
| claude_md_length | 15% | drona23実測値 |
| cache_structure | 25% | Anthropic公式 |
| polite_words | 2% | MindStudio |
| long_prompt | 10% | Qiita |
| clarification_loop | 20% | Anthropic公式 |
| subagent_exploration | 20% | Claude Code公式 |
| claudeignore | 30% | 32blog実測値 |
| plan_mode | 25% | 32blog実測値 |
| mcp_reduction | 15% | alexgreensh/token-optimizer |
| caveman_mode | 65% | GitHub 5400スター・arXiv 2026 |
| specific_file_path | 50% | DEV Community実測値 |
| command_output_limit | 20% | MindStudio |
| claude_md_tiered | 62% | Medium実測値 |
| file_reread_prevention | 15% | DEV Community |
| subagent_large_codebase | 82% | Innovatrix/code-review-graph |
| output_format_spec | 30% | Anthropic公式 |
| session_start_hook | 20% | Medium実測値 |

合計：**21件**（既存9件 + 追加12件）

---

## 実装メモ

```
既存のtips.tsに上記を追記するだけでOK。
条件のfieldはUserStats型に定義済みのフィールドを使用。

caveman_modeとsubagent_large_codebseは削減率が高いが
難易度hardまたはユーザーへの説明が必要なため
Suggestionsカードで「上級者向け」バッジを表示すること。
```

