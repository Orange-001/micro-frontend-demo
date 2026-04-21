/**
 * INTERVIEW TOPIC: 二面6 - AI 接口的超时和重试机制
 *
 * 超时机制：
 * - 使用 AbortController + Promise.race 实现请求超时
 * - AI 接口响应时间不稳定，需要设置合理的超时时间
 *
 * 重试策略 - 指数退避（Exponential Backoff）：
 * - 第1次重试等待 baseDelay (如 1000ms)
 * - 第2次等待 baseDelay * 2 (2000ms)
 * - 第3次等待 baseDelay * 4 (4000ms)
 * - 加入随机抖动（jitter）避免多个客户端同时重试导致的"惊群效应"
 *
 * 为什么不用固定间隔重试：
 * - 固定间隔可能导致服务器在恢复期持续被请求淹没
 * - 指数退避给服务器更多恢复时间，提高最终成功率
 */

import type { RetryOptions } from '../types/chat';

/**
 * 给 Promise 添加超时限制
 * 原理：Promise.race 竞争，超时 Promise 先 resolve 则抛出超时错误
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  message = 'Request timeout',
): Promise<T> {
  const controller = new AbortController();

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(message));
    }, timeout);
    // 如果原始 Promise 先完成，清除定时器
    promise.finally(() => clearTimeout(timer));
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * 带指数退避的重试机制
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxRetries, baseDelay, timeout, onRetry } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 每次尝试都带超时限制
      return await withTimeout(fn(), timeout);
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) throw error;

      // 指数退避 + 随机抖动
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * exponentialDelay * 0.1;
      const totalDelay = exponentialDelay + jitter;

      onRetry?.(attempt + 1, error as Error);

      await sleep(totalDelay);
    }
  }

  // TypeScript 需要这个，实际不会执行到这里
  throw new Error('Retry exhausted');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
