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

import type { StreamChunk, StreamingOptions, Message } from '../types/chat';
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
  const { signal } = options;

  // Mock 模式：使用 ReadableStream 模拟 SSE 流
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const responseText = getMatchedResponse(lastUserMessage?.content ?? '');

  // 构造一个模拟的 ReadableStream，模拟真实 SSE 流的行为
  const mockStream = createMockSSEStream(responseText);
  const reader = mockStream.getReader();
  const decoder = new TextDecoder();

  // INTERVIEW: 二面2 - SSE 解析：处理粘包和分包
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

      // SSE 协议：事件以 \n\n 分隔
      const events = buffer.split('\n\n');
      // 最后一个可能是不完整的事件（分包），留在 buffer 中
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

    // 处理 buffer 中剩余数据
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
 * 格式: "data: <content>" 或 "event: <type>\ndata: <content>"
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

  if (data) {
    return { type: 'text', content: data };
  }

  return null;
}

/**
 * 创建模拟的 SSE ReadableStream
 * 将完整文本按字符拆分为 SSE 事件流，模拟真实 API 的流式返回
 */
function createMockSSEStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    async pull(controller) {
      if (index >= text.length) {
        // 发送结束标记
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        return;
      }

      // 模拟网络延迟：首次 800ms，之后每 chunk 30ms
      const delay = index === 0 ? 800 : 30;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 每次输出 1-3 个字符
      const chunkSize = Math.floor(Math.random() * 3) + 1;
      const chunk = text.slice(index, index + chunkSize);
      index += chunkSize;

      // 构造 SSE 格式数据
      const sseData = `data: ${chunk}\n\n`;
      controller.enqueue(encoder.encode(sseData));
    },
  });
}

/**
 * 停止流式生成
 * 通过 AbortController.abort() 中断 fetch 请求
 */
export function createStreamAbortController(): AbortController {
  return new AbortController();
}
