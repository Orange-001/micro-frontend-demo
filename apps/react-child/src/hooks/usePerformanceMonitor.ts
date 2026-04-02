/**
 * INTERVIEW TOPIC: 二面8 - AI 项目的 CI/CD 和监控指标
 *
 * AI 应用需要关注的前端性能指标：
 * - FCP (First Contentful Paint): 首次内容渲染时间
 * - LCP (Largest Contentful Paint): 最大内容渲染时间
 * - 消息渲染时间: 从收到 AI 响应到渲染完成的耗时
 * - 流式首字延迟: 从发送请求到收到第一个字符的时间
 *
 * 监控方式：
 * - PerformanceObserver API: 监听 paint、largest-contentful-paint 事件
 * - performance.mark / measure: 自定义性能标记
 * - 开发模式下在控制台输出，生产环境可上报到监控平台
 */

import { useEffect, useRef, useCallback } from 'react';
import type { PerformanceMetrics } from '../types/chat';

export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    messageRenderTime: null,
    streamingLatency: null,
  });

  useEffect(() => {
    // 监控 FCP
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries.find((e) => e.name === 'first-contentful-paint');
        if (fcp) {
          metricsRef.current.fcp = fcp.startTime;
          console.log(`[Performance] FCP: ${fcp.startTime.toFixed(1)}ms`);
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });

      // 监控 LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          metricsRef.current.lcp = last.startTime;
          console.log(`[Performance] LCP: ${last.startTime.toFixed(1)}ms`);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      return () => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
      };
    } catch {
      // PerformanceObserver not supported
    }
  }, []);

  // 标记流式响应开始
  const markStreamStart = useCallback(() => {
    performance.mark('stream-start');
  }, []);

  // 标记收到第一个 chunk
  const markFirstChunk = useCallback(() => {
    performance.mark('stream-first-chunk');
    try {
      performance.measure('streaming-latency', 'stream-start', 'stream-first-chunk');
      const measure = performance.getEntriesByName('streaming-latency').pop();
      if (measure) {
        metricsRef.current.streamingLatency = measure.duration;
        console.log(`[Performance] Streaming Latency: ${measure.duration.toFixed(1)}ms`);
      }
    } catch {
      // ignore
    }
  }, []);

  // 标记消息渲染完成
  const markMessageRendered = useCallback(() => {
    performance.mark('message-rendered');
    try {
      performance.measure('message-render-time', 'stream-start', 'message-rendered');
      const measure = performance.getEntriesByName('message-render-time').pop();
      if (measure) {
        metricsRef.current.messageRenderTime = measure.duration;
        console.log(`[Performance] Message Render: ${measure.duration.toFixed(1)}ms`);
      }
    } catch {
      // ignore
    }
  }, []);

  return {
    metrics: metricsRef,
    markStreamStart,
    markFirstChunk,
    markMessageRendered,
  };
}
