/**
 * 客户端 Token 估算
 *
 * 不引入 tiktoken (4MB WASM) — 使用字符计数启发式方法:
 * - ASCII/拉丁字符: ~4 字符/token
 * - CJK 字符: ~2 字符/token
 * - 每条消息额外 ~4 tokens (role + formatting overhead)
 */

import type { Message } from '../types/chat';

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u2e80-\u2eff\u3000-\u303f]/g;

export function estimateTokens(text: string): number {
  const cjkChars = (text.match(CJK_REGEX) || []).length;
  const otherChars = text.length - cjkChars;
  return Math.ceil(cjkChars / 2 + otherChars / 4);
}

export function estimateConversationTokens(messages: Message[]): number {
  let total = 0;
  for (const msg of messages) {
    total += estimateTokens(msg.content) + 4; // 4 tokens overhead per message
  }
  return total;
}

export const COMPACT_MESSAGE_THRESHOLD = 20;
export const COMPACT_TOKEN_THRESHOLD = 4000;

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return String(tokens);
}
