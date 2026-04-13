export type JsonlEntry = {
  type: string;
  message?: {
    role: "user" | "assistant";
    model?: string;
    content?: Array<{
      type: "text" | "tool_use" | "tool_result";
      text?: string;
      name?: string;
    }>;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
  timestamp?: string;
  isSidechain?: boolean;
  isApiErrorMessage?: boolean;
};

export type MessageStat = {
  timestamp: string;
  role: "user" | "assistant";
  promptText: string;
  promptLength: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  model?: string;
  toolCalls: string[];
  estimatedCost: number;
};

export type SessionSummary = {
  sessionId: string;
  projectName: string;
  date: string;
  timestamp: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreationTokens: number;
  totalCost: number;
  messageCount: number;
  durationMinutes: number;
  model: string;
  messages: MessageStat[];
};

export type PlanType = "pro" | "max_5x" | "max_20x" | "api";
export type PeriodType = "weekly" | "monthly";
export type Locale = "ja" | "en";

export type PlanROI = {
  plan: PlanType;
  planCost: number | null;
  apiEquivalent: number;
  roiRatio: number | null;
  isProfitable: boolean | null;
  message: string;
};

export type ChartData = {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cost: number;
};

export type ProjectData = {
  projectName: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  messageCount: number;
};

export type Pattern = {
  id: string;
  detected: boolean;
  value: number;
};

export type TurnStat = {
  timestamp: string;
  projectName: string;
  promptText: string;
  promptLength: number;
  tokens: number;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheCreationCost: number;
};

export type DashboardData = {
  sessions: SessionSummary[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCost: number;
  detectedPlan: PlanType;
  planROI: PlanROI;
  chartData: ChartData[];
  projectBreakdown: ProjectData[];
  patterns: Pattern[];
  allMessages: MessageStat[];
  turns: TurnStat[];
  toolBreakdown: ToolStat[];
};

export type RuleId =
  | "long_prompt"
  | "clarification_loop"
  | "low_cache"
  | "opus_overuse"
  | "long_session"
  | "polite_words"
  | "bash_heavy";

export type RuleSuggestion = {
  id: RuleId;
  priority: "high" | "medium" | "low";
  value: number;
  estimatedSaving: number;
};

export type ToolStat = {
  name: string;
  calls: number;
  cost: number;
};

export type AiSuggestion = {
  title: string;
  description: string;
  before?: string;
  after?: string;
  estimatedSaving?: number;
};
