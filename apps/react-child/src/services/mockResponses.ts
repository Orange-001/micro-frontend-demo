/**
 * Mock AI 响应数据
 * 包含多种类型的 Markdown 内容，用于模拟不同场景的 AI 回复
 */

const RESPONSES: Record<string, string> = {
  code: `好的，这是一个 React 自定义 Hook 的示例：

\`\`\`typescript
import { useState, useCallback } from 'react';

interface UseCounterOptions {
  initialValue?: number;
  min?: number;
  max?: number;
}

export function useCounter(options: UseCounterOptions = {}) {
  const { initialValue = 0, min = -Infinity, max = Infinity } = options;
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => Math.min(prev + 1, max));
  }, [max]);

  const decrement = useCallback(() => {
    setCount((prev) => Math.max(prev - 1, min));
  }, [min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}
\`\`\`

这个 Hook 支持设置最小值、最大值和初始值，使用 \`useCallback\` 避免不必要的重渲染。`,

  math: `## 欧拉公式

欧拉公式是数学中最优美的公式之一，它将五个最重要的数学常数联系在一起：

$$e^{i\\pi} + 1 = 0$$

更一般的形式为：

$$e^{ix} = \\cos(x) + i\\sin(x)$$

其中 $e$ 是自然对数的底数，$i$ 是虚数单位，$\\pi$ 是圆周率。

### 推导过程

利用泰勒展开：

$$e^{ix} = \\sum_{n=0}^{\\infty} \\frac{(ix)^n}{n!} = 1 + ix - \\frac{x^2}{2!} - \\frac{ix^3}{3!} + \\frac{x^4}{4!} + \\cdots$$

分离实部和虚部即可得到结果。`,

  table: `## 主流前端框架对比

| 特性 | React | Vue | Angular | Svelte |
|------|-------|-----|---------|--------|
| 类型 | 库 | 渐进式框架 | 完整框架 | 编译器 |
| 虚拟DOM | ✅ | ✅ | ❌ (Incremental DOM) | ❌ (无运行时) |
| 学习曲线 | 中等 | 较低 | 较高 | 低 |
| 包大小 | ~42KB | ~33KB | ~143KB | ~1.6KB |
| 状态管理 | Redux/Zustand | Pinia/Vuex | NgRx/Signals | 内置 Stores |
| TypeScript | 良好支持 | 良好支持 | 原生支持 | 良好支持 |

> **建议**：根据团队规模和项目复杂度选择。小型项目推荐 Vue 或 Svelte，大型企业项目 React 或 Angular 更适合。`,

  list: `## AI 应用前端开发最佳实践

### 1. 流式响应处理
- 使用 **Fetch API + ReadableStream** 而非 XMLHttpRequest
- 实现逐字符/逐 token 的打字机效果
- 提供停止生成按钮，使用 AbortController 中断请求

### 2. 性能优化
- **虚拟滚动**：长对话历史使用虚拟列表，只渲染可见区域
- **防抖搜索**：搜索建议使用 debounce，避免频繁请求
- **React.memo**：消息气泡组件避免不必要的重渲染
- **代码分割**：使用 React.lazy 按需加载 Markdown 渲染器

### 3. 用户体验
- 流式输出时保持自动滚动
- 支持键盘快捷键（Enter 发送，Shift+Enter 换行）
- 暗色模式支持，减少长时间使用的视觉疲劳

### 4. 安全性
- 对 AI 返回内容进行 XSS 过滤
- API Key 不在前端暴露，通过后端代理
- 限制单次输入的 token 长度`,

  agent: `正在帮你分析这个问题...

[AGENT_STEPS]
{"steps":[{"id":"1","label":"搜索相关资料","status":"done","detail":"找到 12 篇相关文档"},{"id":"2","label":"分析代码结构","status":"done","detail":"识别到 3 个关键模块"},{"id":"3","label":"生成解决方案","status":"done","detail":"完成方案编写"}]}
[/AGENT_STEPS]

根据分析，以下是建议的解决方案：

1. **重构数据层**：将 API 调用抽离到 service 层
2. **优化状态管理**：使用 Redux Toolkit 的 createAsyncThunk
3. **添加错误边界**：防止组件树崩溃`,

  general: `这是一个很好的问题！让我来详细解释一下。

在现代 Web 开发中，有几个关键概念需要理解：

1. **组件化开发**：将 UI 拆分为独立、可复用的组件
2. **状态管理**：使用集中式状态管理（如 Redux）或分散式（如 React Context）
3. **类型安全**：TypeScript 提供编译时类型检查，减少运行时错误

\`\`\`javascript
// 示例：一个简单的状态管理
const [state, dispatch] = useReducer(reducer, initialState);
\`\`\`

希望这个解释对你有帮助！如果有更多问题，随时提问。`,
};

const RESPONSE_KEYS = Object.keys(RESPONSES);

/**
 * 根据用户输入关键词匹配响应，找不到则随机选择
 */
export function getMatchedResponse(input: string, webSearch?: boolean): string {
  const lower = input.toLowerCase();
  if (lower.includes('代码') || lower.includes('code') || lower.includes('hook') || lower.includes('函数')) {
    return RESPONSES.code;
  }
  if (lower.includes('数学') || lower.includes('公式') || lower.includes('math') || lower.includes('欧拉')) {
    return RESPONSES.math;
  }
  if (lower.includes('对比') || lower.includes('比较') || lower.includes('表格') || lower.includes('框架')) {
    return RESPONSES.table;
  }
  if (lower.includes('最佳实践') || lower.includes('优化') || lower.includes('列表')) {
    return RESPONSES.list;
  }
  if (lower.includes('agent') || lower.includes('分析') || lower.includes('搜索')) {
    return RESPONSES.agent;
  }

  // 联网搜索模式：注入搜索结果上下文
  if (webSearch) {
    return `> 🔍 **已搜索网络内容**

基于最新的搜索结果，以下是关于"${input}"的信息：

1. **最新进展**：该技术在过去几个月有了显著更新，社区讨论热度较高
2. **实践建议**：多数开发者推荐结合具体场景使用，注意性能与可维护性的平衡
3. **社区观点**：主流技术博客普遍认为这是一个值得关注的方向

---

这是一个很好的问题！让我来详细解释一下。

在现代 Web 开发中，有几个关键概念需要理解：

1. **组件化开发**：将 UI 拆分为独立、可复用的组件
2. **状态管理**：使用集中式状态管理（如 Redux）或分散式（如 React Context）
3. **类型安全**：TypeScript 提供编译时类型检查，减少运行时错误

\`\`\`javascript
// 示例：一个简单的状态管理
const [state, dispatch] = useReducer(reducer, initialState);
\`\`\`

希望这个解释对你有帮助！如果有更多问题，随时提问。`;
  }

  // 随机选择
  const key = RESPONSE_KEYS[Math.floor(Math.random() * RESPONSE_KEYS.length)];
  return RESPONSES[key];
}
