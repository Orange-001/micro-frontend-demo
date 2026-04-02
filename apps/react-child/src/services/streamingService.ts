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

import type { StreamChunk, StreamingOptions, Message, APIConfig } from '../types/chat';
import { getMatchedResponse } from './mockResponses';

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
    yield* streamFromMock(messages, signal);
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
  const apiMessages: { role: string; content: string }[] = [];

  // 注入 system message (Memory)
  if (systemMessage) {
    apiMessages.push({ role: 'system', content: systemMessage });
  }

  // 转换消息格式
  for (const msg of messages) {
    apiMessages.push({ role: msg.role, content: msg.content });
  }

  // 构建请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiConfig.apiKey}`,
  };

  // OpenRouter 需要额外 headers
  if (apiConfig.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'ChatGPT Clone';
  }

  const body = JSON.stringify({
    model: options.model || apiConfig.defaultModel,
    messages: apiMessages,
    temperature: apiConfig.temperature,
    max_tokens: apiConfig.maxTokens,
    top_p: apiConfig.topP,
    stream: true,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    yield { type: 'error', content: `API Error ${response.status}: ${errorText}` };
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
    reader.releaseLock();
  }
}

/**
 * Mock 模式 — 保持原有逻辑不变
 */
async function* streamFromMock(
  messages: Message[],
  signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const responseText = getMatchedResponse(lastUserMessage?.content ?? '');

  const mockStream = createMockSSEStream(responseText);
  const reader = mockStream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

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
      const content = json.choices?.[0]?.delta?.content;
      if (content !== undefined && content !== null) {
        return { type: 'text', content };
      }
      // delta 中没有 content (如只有 role)，跳过
      return null;
    } catch {
      // JSON 解析失败，当纯文本处理
      return { type: 'text', content: data };
    }
  }

  // 纯文本 (Mock 格式)
  return { type: 'text', content: data };
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
