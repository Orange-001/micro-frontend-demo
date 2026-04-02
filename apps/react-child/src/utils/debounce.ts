/**
 * INTERVIEW TOPIC: 一面5 - 手写防抖函数；一面4 - 闭包
 *
 * 防抖（Debounce）原理：
 * - 在事件被触发后延迟 delay 毫秒执行，如果在延迟期间再次触发则重新计时
 * - 适用于 AI 搜索建议场景：用户输入时不立即请求，等停止输入后才发起搜索
 * - 避免频繁触发 API 调用，减少服务器压力和不必要的渲染
 *
 * 闭包的作用：
 * - timer 变量被闭包捕获，在多次调用间保持引用
 * - 每次调用 debounced 函数时，都能访问并操作同一个 timer
 * - 这就是闭包的典型应用：函数记住了它被创建时的词法作用域
 */

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): DebouncedFunction<T> {
  // 闭包变量：timer 在函数外部不可访问，但 debounced 内部可以持续引用
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    // 如果已有定时器，清除后重新计时（这就是"防抖"的核心）
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
      lastArgs = null;
    }, delay);
  };

  // 取消待执行的调用
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      lastArgs = null;
    }
  };

  // 立即执行待执行的调用
  debounced.flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer);
      fn(...lastArgs);
      timer = null;
      lastArgs = null;
    }
  };

  return debounced;
}
