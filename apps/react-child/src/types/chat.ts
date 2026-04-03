/**
 * INTERVIEW TOPIC: 一面6 - TypeScript 中 Interface 和 Type 的区别
 *
 * Interface vs Type 选型原则：
 * - Interface: 用于定义对象/类的结构（可 extends、可声明合并、语义更清晰）
 * - Type: 用于联合类型、交叉类型、映射类型、条件类型等高级类型操作
 *
 * 在定义 AI 接口返回数据时倾向于用 Interface：
 * 1. API 返回的 JSON 对象天然适合 Interface 描述
 * 2. 后端可能扩展字段，Interface 的声明合并更灵活
 * 3. 错误提示更友好，显示接口名而非内联类型
 */

// ==================== Type Aliases ====================
// 联合类型、字面量类型、工具类型用 Type

export type MessageRole = 'user' | 'assistant' | 'system';

export type Theme = 'light' | 'dark';

export type DateGroup =
  | 'Today'
  | 'Yesterday'
  | 'Previous 7 Days'
  | 'Previous 30 Days'
  | 'Older';

export type GenerativeUIType =
  | 'text'
  | 'code'
  | 'table'
  | 'chart'
  | 'agent-steps';

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error';

export type Reaction = 'like' | 'dislike' | null;

export type APIProvider = 'openrouter' | 'openai' | 'custom';

// 工具类型：从 Conversation 中提取部分字段
export type ConversationSummary = Pick<Conversation, 'id' | 'title' | 'updatedAt' | 'model'>;

// ==================== Interfaces ====================
// 对象结构、实体类型用 Interface

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  isStreaming: boolean;
  reaction: Reaction;
  attachments: Attachment[];
  generativeUIType?: GenerativeUIType;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
  memoryEnabled: boolean;
  compactionHistory: CompactionSummary[];
}

export interface StreamChunk {
  type: 'text' | 'reasoning' | 'error' | 'done';
  content: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface PromptVariable {
  name: string;
  value: string | string[];
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  timeout: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface StreamingOptions {
  model: string;
  timeout?: number;
  signal?: AbortSignal;
  onChunk?: (chunk: StreamChunk) => void;
  apiConfig?: APIConfig;
  systemMessage?: string;
  deepThinking?: boolean;
}

export interface APIConfig {
  provider: APIProvider;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface ProviderPreset {
  id: APIProvider;
  name: string;
  baseUrl: string;
  models: ModelOption[];
}

export interface MemoryItem {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  enabled: boolean;
}

export interface CompactionSummary {
  id: string;
  originalMessageCount: number;
  compactedAt: number;
  summaryContent: string;
}

export interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  messageRenderTime: number | null;
  streamingLatency: number | null;
}

// Agent 任务步骤
export interface AgentStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
  duration?: number;
}

// 日期分组结构
export interface DateGroupedConversations {
  group: DateGroup;
  conversations: ConversationSummary[];
}
