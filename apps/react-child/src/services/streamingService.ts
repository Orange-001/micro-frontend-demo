/**
 * INTERVIEW TOPIC: 一面1 - Promise; 一面2 - Fetch API vs XHR; 二面2 - SSE 流式协议
 *
 * Fetch API vs XMLHttpRequest 流式处理对比：
 *
 * Fetch API（本项目使用）：
 * - response.body 返回 ReadableStream，可通过 reader.read() 逐块消费
 * - 天然支持 AbortController 取消请求
 * - Promise-based API，可与 async/await 配合
 * - 支持 async generator，代码更优雅
 *
 * XMLHttpRequest（传统方式）：
 * - 只能在 onprogress 中获取 responseText（已接收的全部数据）
 * - 需要自行维护偏移量截取增量数据
 * - 取消请求需调用 xhr.abort()，无法与 Promise 链集成
 * - 无法使用 async/await 模式
 *
 * SSE (Server-Sent Events) 协议格式：
 * - 每个事件由 "data: <content>\n\n" 分隔
 * - 支持 event:、id:、retry: 等字段
 * - 以 "data: [DONE]\n\n" 标识流结束
 * - 需要处理"粘包"（一次 read 包含多个事件）和"分包"（一个事件跨多次 read）
 */

import type {
  StreamChunk,
  StreamingOptions,
  Message,
  APIConfig,
  PendingFileAttachment,
} from '../types/chat';
import { getMatchedResponse } from './mockResponses';
import { searchWeb, formatSearchContext } from './webSearch';

const DEFAULT_REQUEST_TIMEOUT = 30_000;
const DEFAULT_STREAM_IDLE_TIMEOUT = 45_000;
const MAX_REQUEST_RETRIES = 2;
const RETRY_BASE_DELAY = 1_000;

/**
 * INTERVIEW: 一面1 - Promise + async generator 处理异步流
 *
 * 使用 AsyncGenerator 而非回调：
 * - 调用方可以用 for await...of 消费数据
 * - 自动处理背压（backpressure）
 * - 错误通过 try/catch 传播，比回调更清晰
 */
export async function* streamChat(
  messages: Message[],
  options: StreamingOptions,
): AsyncGenerator<StreamChunk> {
  const { signal, apiConfig, systemMessage } = options;

  // 决策：有 API Key 走真实 API，否则走 Mock
  if (apiConfig?.apiKey) {
    yield* streamFromRealAPI(messages, options, apiConfig, systemMessage);
  } else {
    yield* streamFromMock(messages, signal, options.webSearch);
  }
}

/**
 * 真实 API 流式调用路径
 * 使用 OpenAI-compatible chat completions API 格式
 * 兼容 OpenRouter、OpenAI、以及任何兼容 API
 */
async function* streamFromRealAPI(
  messages: Message[],
  options: StreamingOptions,
  apiConfig: APIConfig,
  systemMessage?: string,
): AsyncGenerator<StreamChunk> {
  const { signal } = options;
  const url = `${apiConfig.baseUrl.replace(/\/$/, '')}/chat/completions`;

  // 构建消息数组
  const apiMessages: {
    role: string;
    content:
      | string
      | Array<{
          type: string;
          text?: string;
          image_url?: { url: string };
        }>;
  }[] = [];
  const fileAttachments = options.attachments as PendingFileAttachment[] | undefined;

  // 注入 system message (Memory)
  if (systemMessage) {
    apiMessages.push({ role: 'system', content: systemMessage });
  }

  // 转换消息格式
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  for (const msg of messages) {
    const isLastUserMsg = msg === lastUserMsg && fileAttachments && fileAttachments.length > 0;

    if (isLastUserMsg) {
      const contentParts: Array<{
        type: string;
        text?: string;
        image_url?: { url: string };
      }> = [];

      if (msg.content.trim()) {
        contentParts.push({ type: 'text', text: msg.content });
      }

      for (const attachment of fileAttachments) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: attachment.preview },
        });
      }

      apiMessages.push({ role: msg.role, content: contentParts });
    } else {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  // 构建请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiConfig.apiKey}`,
  };

  // OpenRouter 需要额外 headers
  if (apiConfig.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'ChatGPT Clone';
  }

  const bodyObj: Record<string, unknown> = {
    model: options.model || apiConfig.defaultModel,
    messages: apiMessages,
    temperature: apiConfig.temperature,
    max_tokens: apiConfig.maxTokens,
    top_p: apiConfig.topP,
    stream: true,
  };

  // 深度思考：显式控制模型推理行为
  // Qwen3 等模型默认开启 thinking，必须显式传 "off" 才能关闭
  bodyObj.reasoning_effort = options.deepThinking ? 'high' : 'none';

  // 联网搜索：不同提供商使用不同方式
  if (options.webSearch) {
    if (apiConfig.provider === 'openrouter') {
      // OpenRouter 使用 tools 方式
      bodyObj.tools = [{ type: 'openrouter:web_search' as const }];
    } else if (apiConfig.provider === 'openai') {
      // OpenAI GPT-4o+ 原生支持 web_search 工具
      bodyObj.tools = [{ type: 'web_search' as const }];
    } else {
      // Custom 提供商：通过 SearXNG 等外部搜索获取结果，注入到 system message 中
      const searchUrl = apiConfig.searchBaseUrl;
      if (searchUrl && lastUserMsg) {
        try {
          const results = await searchWeb(lastUserMsg.content, searchUrl);
          const searchContext = formatSearchContext(results);
          const existingSystemMessage = bodyObj.systemMessage as string | undefined;
          bodyObj.systemMessage = existingSystemMessage
            ? `${existingSystemMessage}\n\n${searchContext}`
            : searchContext;
        } catch (err: any) {
          // 搜索失败时不影响正常对话，静默跳过
          console.warn('[webSearch] search failed:', err.message);
        }
      }
    }
  }

  const body = JSON.stringify(bodyObj);

  let response: Response;
  try {
    response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers,
        body,
      },
      {
        signal,
        timeout: options.timeout ?? DEFAULT_REQUEST_TIMEOUT,
        maxRetries: MAX_REQUEST_RETRIES,
        baseDelay: RETRY_BASE_DELAY,
      },
    );
  } catch (error: any) {
    if (signal?.aborted) return;
    yield { type: 'error', content: formatRequestError(error) };
    return;
  }

  if (!response.body) {
    yield { type: 'error', content: 'Response body is empty' };
    return;
  }

  // 读取流
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const abortReader = () => {
    void reader.cancel();
  };
  signal?.addEventListener('abort', abortReader, { once: true });

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        return;
      }

      const { done, value } = await readWithIdleTimeout(
        reader,
        DEFAULT_STREAM_IDLE_TIMEOUT,
        signal,
      );
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        if (!event.trim()) continue;
        const chunk = parseSSEEvent(event);
        if (chunk) {
          if (chunk.type === 'done') return;
          yield chunk;
        }
      }
    }

    if (buffer.trim()) {
      const chunk = parseSSEEvent(buffer);
      if (chunk && chunk.type !== 'done') yield chunk;
    }
  } finally {
    signal?.removeEventListener('abort', abortReader);
    reader.releaseLock();
  }
}

/**
 * Mock 模式 — 保持原有逻辑不变
 */
async function* streamFromMock(
  messages: Message[],
  signal?: AbortSignal,
  webSearch?: boolean,
): AsyncGenerator<StreamChunk> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const responseText = getMatchedResponse(lastUserMessage?.content ?? '', webSearch);

  const mockStream = createMockSSEStream(responseText);
  const reader = mockStream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const abortReader = () => {
    void reader.cancel();
  };
  signal?.addEventListener('abort', abortReader, { once: true });

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        if (!event.trim()) continue;
        const chunk = parseSSEEvent(event);
        if (chunk) {
          if (chunk.type === 'done') return;
          yield chunk;
        }
      }
    }

    if (buffer.trim()) {
      const chunk = parseSSEEvent(buffer);
      if (chunk && chunk.type !== 'done') yield chunk;
    }
  } finally {
    signal?.removeEventListener('abort', abortReader);
    reader.releaseLock();
  }
}

/**
 * 解析单个 SSE 事件
 * 支持两种格式：
 * 1. Mock 模式: "data: <plain text>"
 * 2. 真实 API: "data: {"choices":[{"delta":{"content":"..."}}]}"
 */
function parseSSEEvent(event: string): StreamChunk | null {
  const lines = event.split('\n');
  let data = '';
  let eventType = 'message';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      data = line.slice(6);
    } else if (line.startsWith('event: ')) {
      eventType = line.slice(7);
    }
  }

  if (data === '[DONE]') {
    return { type: 'done', content: '' };
  }

  if (eventType === 'error') {
    return { type: 'error', content: data };
  }

  if (!data) return null;

  // 尝试解析 JSON (真实 API 格式)
  if (data.startsWith('{')) {
    try {
      const json = JSON.parse(data);
      const delta = json.choices?.[0]?.delta;
      if (!delta) return null;

      // 推理/思考内容优先检查（Qwen/DeepSeek/Gemini 等模型）
      // Qwen 在 thinking 阶段会同时返回 content:"" 和 reasoning:"..."
      // 必须先检查 reasoning，否则空 content 会短路掉 reasoning 分支
      const reasoning = delta.reasoning_content ?? delta.reasoning;
      if (reasoning) {
        return { type: 'reasoning', content: reasoning };
      }
      // 正文内容（排除空字符串）
      if (delta.content) {
        return { type: 'text', content: delta.content };
      }
      // delta 中没有有效内容 (如只有 role，或 content:"")，跳过
      return null;
    } catch {
      // JSON 解析失败，当纯文本处理
      return { type: 'text', content: data };
    }
  }

  // 纯文本 (Mock 格式)
  return { type: 'text', content: data };
}

class RequestTimeoutError extends Error {
  constructor(timeout: number) {
    super(`请求超时（${Math.round(timeout / 1000)}s）`);
    this.name = 'RequestTimeoutError';
  }
}

class StreamIdleTimeoutError extends Error {
  constructor(timeout: number) {
    super(`流式响应超时：${Math.round(timeout / 1000)}s 内没有收到新数据`);
    this.name = 'StreamIdleTimeoutError';
  }
}

class RetryableHTTPError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`API Error ${status}: ${body}`);
    this.name = 'RetryableHTTPError';
  }
}

class NonRetryableHTTPError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`API Error ${status}: ${body}`);
    this.name = 'NonRetryableHTTPError';
  }
}

interface FetchRetryOptions {
  signal?: AbortSignal;
  timeout: number;
  maxRetries: number;
  baseDelay: number;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: FetchRetryOptions,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, init, options.timeout, options.signal);
      if (response.ok) return response;

      const errorText = await response.text().catch(() => response.statusText);
      const error = isRetryableStatus(response.status)
        ? new RetryableHTTPError(response.status, errorText)
        : new NonRetryableHTTPError(response.status, errorText);

      if (!isRetryableError(error) || attempt === options.maxRetries) throw error;
      lastError = error;
    } catch (error) {
      if (options.signal?.aborted) throw error;
      if (!isRetryableError(error) || attempt === options.maxRetries) throw error;
      lastError = error;
    }

    await delay(getRetryDelay(options.baseDelay, attempt), options.signal);
  }

  throw lastError instanceof Error ? lastError : new Error('请求重试失败');
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeout: number,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromOuterSignal = () => {
    controller.abort();
  };

  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abortFromOuterSignal, { once: true });

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) throw new RequestTimeoutError(timeout);
    throw error;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromOuterSignal);
  }
}

async function readWithIdleTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeout: number,
  signal?: AbortSignal,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  if (signal?.aborted) {
    await reader.cancel();
    return { done: true, value: undefined };
  }

  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      reader.read(),
      new Promise<ReadableStreamReadResult<Uint8Array>>((_, reject) => {
        timer = setTimeout(() => {
          void reader.cancel();
          reject(new StreamIdleTimeoutError(timeout));
        }, timeout);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof RequestTimeoutError) return true;
  if (error instanceof RetryableHTTPError) return true;
  return error instanceof TypeError;
}

function getRetryDelay(baseDelay: number, attempt: number): number {
  const exponentialDelay = baseDelay * 2 ** attempt;
  const jitter = Math.random() * exponentialDelay * 0.1;
  return exponentialDelay + jitter;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(resolve, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
  });
}

function formatRequestError(error: unknown): string {
  if (error instanceof NonRetryableHTTPError || error instanceof RetryableHTTPError) {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return '请求失败，请稍后重试';
}

/**
 * 创建模拟的 SSE ReadableStream
 */
function createMockSSEStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    async pull(controller) {
      if (index >= text.length) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        return;
      }

      const delay = index === 0 ? 800 : 30;
      await new Promise((resolve) => setTimeout(resolve, delay));

      const chunkSize = Math.floor(Math.random() * 3) + 1;
      const chunk = text.slice(index, index + chunkSize);
      index += chunkSize;

      const sseData = `data: ${chunk}\n\n`;
      controller.enqueue(encoder.encode(sseData));
    },
  });
}

export function createStreamAbortController(): AbortController {
  return new AbortController();
}
