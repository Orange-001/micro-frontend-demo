# 📊 ChatGPT Web 应用完善规划报告

> 生成时间：2026-04-17
> 项目路径：apps/react-child

---

## 一、当前项目能力分析

### 1.1 已实现的核心功能

#### ✅ 会话管理系统

| 功能                 | 状态      | 实现位置                                      |
| -------------------- | --------- | --------------------------------------------- |
| 多会话创建/删除/切换 | ✅ 已实现 | `chatSlice.ts`, `Sidebar.tsx`                 |
| 会话列表按日期分组   | ✅ 已实现 | `dateGrouping.ts`, `ConversationList.tsx`     |
| 会话搜索过滤         | ✅ 已实现 | `Sidebar.tsx` (useTransition)                 |
| 会话重命名           | ✅ 已实现 | `ConversationItem.tsx`                        |
| 自动标题生成         | ✅ 已实现 | `chatSlice.ts` (第一条消息截取30字符)         |
| LocalStorage持久化   | ✅ 已实现 | `storageService.ts`, `useLocalStorageSync.ts` |

#### ✅ 流式对话系统

| 功能                                       | 状态      | 实现位置                              |
| ------------------------------------------ | --------- | ------------------------------------- |
| SSE 流式响应                               | ✅ 已实现 | `streamingService.ts`                 |
| 多API提供商支持 (OpenRouter/OpenAI/Custom) | ✅ 已实现 | `providers.ts`, `streamingService.ts` |
| Mock 模式 (无API Key)                      | ✅ 已实现 | `mockResponses.ts`                    |
| AbortController 取消请求                   | ✅ 已实现 | `useStreamingResponse.ts`             |
| Deep Thinking (推理模式)                   | ✅ 已实现 | `reasoning_effort: 'high'`            |
| Web Search 联网搜索                        | ✅ 已实现 | SearXNG / OpenRouter tools            |
| 图片附件 (Vision)                          | ✅ 已实现 | InputArea + streamingService          |
| 文本文件内联                               | ✅ 已实现 | `fileUtils.ts`                        |

#### ✅ 消息渲染系统

| 功能                | 状态      | 实现位置                       |
| ------------------- | --------- | ------------------------------ |
| Markdown + GFM      | ✅ 已实现 | `MarkdownRenderer.tsx`         |
| 代码块语法高亮      | ✅ 已实现 | `CodeBlock.tsx` (highlight.js) |
| 数学公式 (KaTeX)    | ✅ 已实现 | `MarkdownRenderer.tsx`         |
| Mermaid 图表        | ✅ 已实现 | `MermaidBlock.tsx`             |
| 消息编辑 + 重新生成 | ✅ 已实现 | `editAndResendMessage`         |
| Like/Dislike 反应   | ✅ 已实现 | `MessageActions.tsx`           |
| 复制消息            | ✅ 已实现 | `MessageActions.tsx`           |

#### ✅ 记忆与上下文管理

| 功能                            | 状态      | 实现位置                             |
| ------------------------------- | --------- | ------------------------------------ |
| Memory 系统提示注入             | ✅ 已实现 | `memoryBuilder.ts`                   |
| 会话级记忆开关                  | ✅ 已实现 | `Conversation.memoryEnabled`         |
| Context Compaction (上下文压缩) | ✅ 已实现 | `compaction.ts`, `CompactionBar.tsx` |
| Token估算                       | ✅ 已实现 | `tokenEstimation.ts`                 |

#### ✅ 用户界面

| 功能           | 状态      | 实现位置                        |
| -------------- | --------- | ------------------------------- |
| 深色/浅色主题  | ✅ 已实现 | `uiSlice.ts`, `ThemeToggle.tsx` |
| 侧边栏折叠     | ✅ 已实现 | `Sidebar.tsx`                   |
| 键盘快捷键     | ✅ 已实现 | `useKeyboardShortcuts.ts`       |
| 快捷键自定义   | ✅ 已实现 | `ShortcutsConfigModal.tsx`      |
| API 设置面板   | ✅ 已实现 | `SettingsDrawer.tsx`            |
| 模型选择器     | ✅ 已实现 | `ModelSelector.tsx`             |
| 欢迎页面建议卡 | ✅ 已实现 | `WelcomeScreen.tsx`             |

#### ✅ 性能与工程化

| 功能                   | 状态      | 实现位置                     |
| ---------------------- | --------- | ---------------------------- |
| qiankun 微前端支持     | ✅ 已实现 | `main.tsx`, `vite.config.ts` |
| flushSync 流式渲染优化 | ✅ 已实现 | `useStreamingResponse.ts`    |
| useTransition 搜索优化 | ✅ 已实现 | `Sidebar.tsx`                |
| 手写 debounce          | ✅ 已实现 | `debounce.ts`                |
| 性能监控               | ✅ 已实现 | `usePerformanceMonitor.ts`   |
| 导出对话 (JSON/MD)     | ✅ 已实现 | `exportConversation.ts`      |

---

### 1.2 技术架构优缺点分析

#### 🟢 优点

| 方面           | 评价       | 说明                                               |
| -------------- | ---------- | -------------------------------------------------- |
| **状态管理**   | ⭐⭐⭐⭐   | Redux Toolkit 结构清晰，slice划分合理，易扩展      |
| **代码质量**   | ⭐⭐⭐⭐⭐ | 类型定义完整，注释详尽（面试考点标注），工程化规范 |
| **流式处理**   | ⭐⭐⭐⭐⭐ | AsyncGenerator + SSE解析 + 背压处理，最佳实践      |
| **组件分层**   | ⭐⭐⭐⭐   | UI/业务组件分离较好，styled-components隔离样式     |
| **可扩展性**   | ⭐⭐⭐⭐   | API提供商抽象良好，易于添加新provider              |
| **微前端适配** | ⭐⭐⭐⭐   | qiankun集成完善，可嵌入主应用                      |

#### 🔴 缺点与不足

| 方面                            | 问题                             | 影响                              |
| ------------------------------- | -------------------------------- | --------------------------------- |
| **无用户登录系统**              | 纯前端，数据仅存localStorage     | 无法跨设备同步、无权限控制        |
| **无后端服务**                  | 直接调用第三方API                | 无法统一管理API Key、无数据持久化 |
| **消息虚拟滚动未启用**          | `useVirtualScroll.ts` 仅面试示例 | 长对话会卡顿                      |
| **无PWA支持**                   | 无Service Worker                 | 无法离线使用、无推送通知          |
| **无多语言支持**                | 界面仅中文                       | 国际化受限                        |
| **无协作功能**                  | 无分享、无团队协作               | 无法多人使用                      |
| **无工具调用/Function Calling** | 仅WebSearch简单实现              | Agent能力受限                     |
| **无语音交互**                  | 无TTS/STT                        | 用户体验不完整                    |

---

## 二、功能完善规划（重点）

### 2.1 会话系统增强

#### 🔹 会话版本控制（分支对话）

- **功能说明**：允许从历史消息创建分支，保留多条"可能的后续"对话路径
- **为什么需要**：ChatGPT/Claude核心能力，便于探索不同回复方向
- **实现思路**：

  ```typescript
  // 数据结构扩展
  interface Conversation {
    branches: {
      parentMessageId: string; // 分叉点
      branchMessages: Message[];
    }[];
    activeBranchIndex: number;
  }
  ```

  - 前端：UI展示分支切换器，支持合并/删除分支
  - 后端：存储分支数据，支持分支搜索

- **复杂度**：中

#### 🔹 会话标签/分类

- **功能说明**：用户可为会话添加标签（如"工作"、"学习"、"代码"）
- **为什么需要**：便于管理和检索大量会话
- **实现思路**：
  - 前端：标签选择器，按标签过滤
  - 后端：标签CRUD，标签统计
- **复杂度**：低

#### 🔹 会话导出增强

- **功能说明**：支持导出为PDF、Word、导出到Notion/飞书
- **为什么需要**：用户需要将对话整理为文档
- **实现思路**：
  - PDF：使用 `jspdf` + `html2canvas`
  - Notion/飞书：OAuth授权 + API上传
- **复杂度**：中

#### 🔹 会话分享

- **功能说明**：生成公开链接，他人可查看对话（可设置密码/有效期）
- **为什么需要**：便于知识分享、团队协作
- **实现思路**：
  - 前端：分享按钮 + 链接生成弹窗
  - 后端：生成短链接、访问统计、权限校验
- **复杂度**：中

---

### 2.2 AI能力增强

#### 🔹 Function Calling / Tool Use（重点）

- **功能说明**：让AI调用外部工具（搜索、计算、执行代码、访问API）
- **为什么需要**：这是Agent的核心能力，ChatGPT/Claude的核心差异
- **实现思路**：

  ```typescript
  // 新增类型定义
  interface ToolDefinition {
    name: string;
    description: string;
    parameters: JSONSchema;
    execute: (params: any) => Promise<any>;
  }

  // 流式处理扩展
  interface StreamChunk {
    type: 'text' | 'reasoning' | 'tool_call' | 'tool_result' | 'error' | 'done';
    tool_call?: { name: string; arguments: any; call_id: string };
    tool_result?: { call_id: string; result: any };
  }
  ```

  - 前端：工具配置面板、工具调用可视化（AgentTaskPanel增强）
  - 后端：工具注册、工具执行沙箱、结果返回

- **复杂度**：高

#### 🔹 代码执行沙箱

- **功能说明**：在安全环境中执行AI生成的代码（Python/JS）
- **为什么需要**：让用户直接验证代码效果，ChatGPT Advanced Data Analysis
- **实现思路**：
  - 前端：代码执行按钮、执行结果展示、错误处理
  - 后端：Docker容器隔离、执行时间限制、资源限制
- **复杂度**：高

#### 🔹 多模态增强

- **功能说明**：支持语音输入（STT）、语音输出（TTS）、视频分析
- **为什么需要**：更自然的交互方式，Cursor已支持语音
- **实现思路**：
  - STT：Web Audio API + Whisper API
  - TTS：OpenAI TTS / ElevenLabs
  - 前端：录音按钮、语音播放控件
- **复杂度**：中

#### 🔹 RAG 知识库检索

- **功能说明**：用户上传文档/代码库，AI基于私有知识回答
- **为什么需要**：企业级应用的核心能力，Claude Projects已实现
- **实现思路**：
  - 前端：知识库管理面板、文件上传、检索结果展示
  - 后端：向量数据库（如pgvector）、嵌入模型、检索服务
- **复杂度**：高

#### 🔹 Prompt 模板库

- **功能说明**：预设常用Prompt模板（翻译、代码审查、写作等），用户可自定义
- **为什么需要**：降低使用门槛，提高效率
- **实现思路**：
  - 前端：模板选择器、模板编辑器、模板变量填充UI
  - 后端：模板CRUD、模板分享
- **复杂度**：低

---

### 2.3 用户体验增强

#### 🔹 消息引用/回复

- **功能说明**：可在对话中引用某条历史消息，AI基于引用内容回答
- **为什么需要**：复杂对话中需要"回到某个上下文"
- **实现思路**：

  ```typescript
  interface Message {
    quotedMessageId?: string; // 引用哪条消息
    quotedContent?: string; // 引用内容预览
  }
  ```

  - 前端：消息引用按钮、引用展示

- **复杂度**：低

#### 🔹 消息版本历史

- **功能说明**：保存每次重新生成的回复，可查看历史版本
- **为什么需要**：对比不同回复质量，选择最佳版本
- **实现思路**：
  ```typescript
  interface Message {
    versions: { content: string; createdAt: number }[];
    activeVersionIndex: number;
  }
  ```
- **复杂度**：中

#### 🔹 消息搜索

- **功能说明**：在当前会话中搜索关键词，高亮匹配内容
- **为什么需要**：长对话中快速定位内容
- **实现思路**：
  - 前端：搜索框 + 结果列表 + 消息跳转
- **复杂度**：低

#### 🔹 输入增强

- **功能说明**：
  - 自动补全（基于历史消息、Prompt模板）
  - 语音输入
  - 粘贴图片自动识别
  - Markdown实时预览
- **为什么需要**：提升输入效率
- **实现思路**：
  - 自动补全：历史消息统计 + Trie树匹配
  - 语音：Web Audio API + STT
  - 图片粘贴：Clipboard API
- **复杂度**：中

#### 🔹 快捷键增强

- **功能说明**：
  - 添加更多快捷键（重新生成、复制最后回复、清空会话）
  - 支持VSCode风格的命令面板（Cmd+K）
  - 快捷键提示tooltip
- **为什么需要**：高级用户效率工具
- **实现思路**：
  - 扩展 `shortcuts.ts`
  - 添加 CommandPalette 组件
- **复杂度**：低

---

### 2.4 用户体系与权限

#### 🔹 用户登录/注册

- **功能说明**：支持邮箱注册、OAuth登录（Google/GitHub）
- **为什么需要**：跨设备同步、个性化设置、付费功能
- **实现思路**：
  - 前端：登录页面、OAuth回调
  - 后端：JWT认证、用户表、OAuth集成
- **复杂度**：中

#### 🔹 数据同步

- **功能说明**：会话数据云端存储，跨设备同步
- **为什么需要**：现代应用标配，用户换设备不丢数据
- **实现思路**：
  - 前端：同步状态展示、冲突处理
  - 后端：CRDT / 版本控制同步算法
- **复杂度**：高

#### 🔹 用量统计与付费

- **功能说明**：统计API调用次数、Token用量，支持订阅付费
- **为什么需要**：商业化基础，防止滥用
- **实现思路**：
  - 前端：用量仪表盘、订阅页面
  - 后端：用量追踪、Stripe/支付宝集成
- **复杂度**：中

---

### 2.5 插件/扩展系统

#### 🔹 MCP 协议支持

- **功能说明**：支持Anthropic MCP协议，接入外部工具/数据源
- **为什么需要**：Claude Code已采用，统一工具接入标准
- **实现思路**：
  - 前端：MCP Server配置面板
  - 后端：MCP协议实现、工具代理
- **复杂度**：高

#### 🔹 自定义工具插件

- **功能说明**：用户可上传/配置自定义工具（API调用、脚本执行）
- **为什么需要**：扩展AI能力边界
- **实现思路**：
  - 前端：插件配置界面、插件市场
  - 后端：插件沙箱执行、权限控制
- **复杂度**：高

---

## 三、技术架构升级建议

### 3.1 状态管理升级

#### 当前状态：Redux Toolkit ✅ 已较完善

#### 建议优化：

```
┌─────────────────────────────────────────────────────────────┐
│                    状态分层建议                              │
├─────────────────────────────────────────────────────────────┤
│  UI State (本地)      → useState / Zustand                  │
│  会话 State (全局)    → Redux Toolkit (保留)                │
│  API State (服务端)   → React Query / SWR                   │
│  临时 State (流式)    → useRef + useCallback                │
└─────────────────────────────────────────────────────────────┘
```

#### 具体建议：

1. **引入 React Query**：用于API数据获取（模型列表、用户信息、同步数据）
2. **优化 Redux selectors**：使用 `createSelector` 避免重复计算
   ```typescript
   // 示例
   const selectActiveMessages = createSelector(
     [(state) => state.chat.activeConversationId, (state) => state.chat.conversations],
     (id, convs) => convs[id]?.messages ?? [],
   );
   ```
3. **分离临时状态**：将 `isStreaming`、`pendingFiles` 等放入 hook 本地状态

---

### 3.2 数据流设计优化

#### 当前问题：

- 消息数据直接存储在 Conversation 中，无版本控制
- 无服务端同步机制

#### 推荐架构：

```
┌─────────────────────────────────────────────────────────────┐
│                     数据流架构                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   User Input → Optimistic Update → Local Store              │
│                    ↓                                        │
│              Streaming Handler                              │
│                    ↓                                        │
│              API Response → Merge → Local + Remote Store    │
│                    ↓                                        │
│              UI Re-render                                   │
│                                                             │
│   [Offline Mode] → Queue → Sync when online                 │
│   [Conflict]    → Last-write-wins or User chooses           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 关键实现：

```typescript
// 消息版本管理
interface MessageVersion {
  id: string;
  content: string;
  createdAt: number;
  model: string;
  metadata: { tokens: number; latency: number };
}

interface Message {
  versions: MessageVersion[];
  activeVersionId: string;
}

// 同步队列
interface SyncQueueItem {
  type: 'create' | 'update' | 'delete';
  entity: 'conversation' | 'message';
  data: any;
  timestamp: number;
  retryCount: number;
}
```

---

### 3.3 组件设计优化

#### 当前状态：组件分层较好，但可进一步原子化

#### 建议：采用 Atomic Design 模式

```
┌─────────────────────────────────────────────────────────────┐
│                    组件分层建议                              │
├─────────────────────────────────────────────────────────────┤
│  Atoms (原子组件)                                            │
│    - Button, Icon, Spinner, Badge, Tooltip                  │
│    - 基于 Ant Design 薄封装                                  │
│                                                             │
│  Molecules (分子组件)                                        │
│    - MessageBubble, CodeBlock, SearchInput                  │
│    - FilePreview, ReactionButton                            │
│                                                             │
│  Organisms (有机组件)                                        │
│    - MessageList, Sidebar, InputArea                        │
│    - SettingsPanel, MemoryPanel                             │
│                                                             │
│  Templates (模板)                                            │
│    - ChatTemplate, SettingsTemplate                         │
│                                                             │
│  Pages (页面)                                                │
│    - ChatView, LoginView, SettingsView                      │
└─────────────────────────────────────────────────────────────┘
```

#### 具体优化：

1. **抽取原子组件**：统一 Button、Icon 等基础组件风格
2. **MessageBubble 拆分**：
   - `MessageHeader` (时间、角色)
   - `MessageContent` (Markdown渲染)
   - `MessageFooter` (操作按钮)
3. **创建 Compound Components**：
   ```tsx
   <Message>
     <Message.Header />
     <Message.Content />
     <Message.Actions />
   </Message>
   ```

---

### 3.4 性能优化建议

#### 🔹 消息虚拟滚动（必须启用）

```typescript
// 推荐使用 react-window 或 自有实现
import { VariableSizeList } from 'react-window';

// 动态高度缓存
const heightCache = useRef(new Map<string, number>());

// 每条消息渲染
const Row = ({ index, style }) => (
  <div style={style}>
    <MessageBubble message={messages[index]} />
  </div>
);

<VariableSizeList
  height={600}
  itemCount={messages.length}
  itemSize={(i) => heightCache.current.get(messages[i].id) ?? 100}
  estimatedItemSize={100}
>
  {Row}
</VariableSizeList>
```

#### 🔹 Markdown 渲染优化

- 使用 `react-markdown` + `remark-gfm` 替代当前实现
- 添加 `rehype-raw` 允许 HTML
- 添加 `memo` 包装组件，避免不必要的重渲染

#### 🔹 代码块懒加载

```tsx
// 大代码块延迟渲染
const LazyCodeBlock = lazy(() => import('./CodeBlock'));

// 超过100行才懒加载
{
  codeLines > 100 ? (
    <Suspense fallback={<Skeleton />}>
      <LazyCodeBlock code={code} />
    </Suspense>
  ) : (
    <CodeBlock code={code} />
  );
}
```

#### 🔹 首屏优化

- 路由级代码分割 (`React.lazy`)
- 会话列表分页加载
- 预加载当前会话消息

---

### 3.5 可维护性建议

#### 🔹 目录结构重组

```
src/
├── atoms/              # 基础UI组件
├── molecules/          # 组合组件
├── organisms/          # 业务组件
├── templates/          # 页面模板
├── pages/              # 页面
├── hooks/              # Hooks
│   ├── domain/         # 业务hooks (useConversation, useMessage)
│   └── utility/        # 工具hooks (useDebounce, useAutoResize)
├── services/           # API服务
│   ├── api/            # HTTP请求
│   ├── streaming/      # 流式处理
│   └── storage/        # 本地存储
├── store/              # Redux
├── types/              # 类型定义
├── utils/              # 工具函数
├── constants/          # 常量
└── styles/             # 样式
```

#### 🔹 添加测试

- 单元测试：Jest + React Testing Library
- E2E测试：Playwright
- 流式测试：Mock SSE服务

#### 🔹 文档化

- 使用 Storybook 展示组件
- API文档（使用 TypeDoc）
- README 更新

---

## 四、优先级路线图

### P0 - 必须做（基础完善）

| 任务                   | 预估工时 | 依赖 |
| ---------------------- | -------- | ---- |
| 启用消息虚拟滚动       | 2天      | 无   |
| 添加消息搜索功能       | 1天      | 无   |
| 添加消息引用功能       | 1天      | 无   |
| 添加消息版本历史       | 2天      | 无   |
| 添加会话标签系统       | 1天      | 无   |
| 优化 Markdown 渲染性能 | 1天      | 无   |
| 添加 Prompt 模板库     | 2天      | 无   |
| 扩展快捷键系统         | 1天      | 无   |

**总计：约 1-2 周**

---

### P1 - 重要增强（体验提升）

| 任务               | 预估工时 | 依赖     |
| ------------------ | -------- | -------- |
| 用户登录系统       | 3天      | 后端服务 |
| 数据云端同步       | 4天      | 用户登录 |
| 会话分享功能       | 2天      | 后端服务 |
| 多模态支持（语音） | 3天      | API集成  |
| 输入自动补全       | 2天      | 无       |
| 会话分支功能       | 3天      | 无       |
| 导出增强（PDF等）  | 2天      | 无       |
| 性能监控仪表盘     | 1天      | 无       |

**总计：约 2-3 周**

---

### P2 - 高级能力（商业化）

| 任务                      | 预估工时 | 依赖             |
| ------------------------- | -------- | ---------------- |
| Function Calling 工具系统 | 5天      | 无               |
| 代码执行沙箱              | 4天      | Function Calling |
| RAG 知识库                | 5天      | 后端服务         |
| MCP 协议支持              | 4天      | Function Calling |
| 插件系统                  | 5天      | MCP              |
| 用量统计与付费            | 3天      | 用户登录         |
| PWA 离线支持              | 2天      | 无               |
| 多语言国际化              | 2天      | 无               |

**总计：约 4-5 周**

---

## 五、可直接落地的任务清单（工程化）

### 阶段一：基础完善 (P0)

```markdown
## 会话系统

- [ ] 实现会话标签系统
  - [ ] 添加 Conversation.tags 字段
  - [ ] 创建 TagSelector 组件
  - [ ] 实现标签过滤逻辑
  - [ ] 添加标签管理弹窗

## 消息系统

- [ ] 实现消息虚拟滚动
  - [ ] 安装 react-window
  - [ ] 创建 VirtualMessageList 组件
  - [ ] 实现动态高度缓存
  - [ ] 集成到 MessageList

- [ ] 实现消息引用功能
  - [ ] 添加 Message.quotedMessageId 字段
  - [ ] 创建 QuoteButton 组件
  - [ ] 创建 QuotePreview 展示组件
  - [ ] 修改 streamingService 支持引用

- [ ] 实现消息版本历史
  - [ ] 扩展 Message.versions 数据结构
  - [ ] 创建 VersionHistoryPanel 组件
  - [ ] 实现版本切换逻辑
  - [ ] 添加版本对比视图

- [ ] 实现消息搜索
  - [ ] 创建 MessageSearchInput 组件
  - [ ] 实现关键词高亮
  - [ ] 添加搜索结果跳转

## Prompt 系统

- [ ] 实现 Prompt 模板库
  - [ ] 创建 PromptTemplate 类型
  - [ ] 创建 TemplateSelector 组件
  - [ ] 实现模板变量填充 UI
  - [ ] 添加模板 CRUD

## 快捷键

- [ ] 扩展快捷键配置
  - [ ] 添加更多快捷键定义
  - [ ] 创建快捷键提示 Tooltip
  - [ ] 实现 CommandPalette (Cmd+K)

## 性能优化

- [ ] Markdown 渲染优化
  - [ ] 添加 memo 包装
  - [ ] 实现大代码块懒加载
  - [ ] 优化 KaTeX 渲染
```

---

### 阶段二：重要增强 (P1)

```markdown
## 用户系统

- [ ] 实现用户登录
  - [ ] 创建 LoginView 页面
  - [ ] 实现 JWT 认证逻辑
  - [ ] 创建 userSlice
  - [ ] 实现 OAuth 登录（Google/GitHub）

- [ ] 实现数据同步
  - [ ] 创建 syncService
  - [ ] 实现同步队列
  - [ ] 添加冲突检测
  - [ ] 创建 SyncStatusIndicator

## 会话增强

- [ ] 实现会话分享
  - [ ] 创建 ShareModal 组件
  - [ ] 实现分享链接生成
  - [ ] 添加分享权限设置
  - [ ] 创建 ShareView 公开页面

- [ ] 实现会话分支
  - [ ] 扩展 Conversation.branches
  - [ ] 创建 BranchSelector 组件
  - [ ] 实现分支创建逻辑
  - [ ] 实现分支合并/删除

## 多模态

- [ ] 实现语音输入
  - [ ] 创建 VoiceInputButton
  - [ ] 集成 Web Audio API
  - [ ] 实现 Whisper API 调用

- [ ] 实现语音输出
  - [ ] 创建 TTSButton 组件
  - [ ] 集成 TTS API
  - [ ] 实现语音播放控件

## 导出增强

- [ ] 实现导出为 PDF
  - [ ] 安装 jspdf + html2canvas
  - [ ] 创建 PDFExporter
  - [ ] 实现样式适配

## 输入增强

- [ ] 实现输入自动补全
  - [ ] 创建 AutoCompleteDropdown
  - [ ] 实现历史消息 Trie 树
  - [ ] 添加模板快捷填充
```

---

### 阶段三：高级能力 (P2)

```markdown
## Function Calling

- [ ] 实现工具系统基础
  - [ ] 定义 ToolDefinition 类型
  - [ ] 扩展 StreamChunk 支持 tool_call
  - [ ] 创建 ToolExecutor 服务
  - [ ] 实现工具调用循环

- [ ] 创建工具配置界面
  - [ ] 创建 ToolsPanel 组件
  - [ ] 实现工具开关
  - [ ] 添加工具参数配置

- [ ] 实现工具可视化
  - [ ] 增强 AgentTaskPanel
  - [ ] 展示工具调用详情
  - [ ] 显示工具执行结果

## 代码执行

- [ ] 实现代码沙箱
  - [ ] 后端 Docker 环境搭建
  - [ ] 创建 CodeExecutor API
  - [ ] 前端 ExecuteButton 组件
  - [ ] 执行结果展示

## RAG 知识库

- [ ] 实现知识库管理
  - [ ] 创建 KnowledgeBasePanel
  - [ ] 实现文件上传
  - [ ] 实现向量存储服务
  - [ ] 实现检索集成

## MCP 支持

- [ ] 实现 MCP 客户端
  - [ ] 创建 MCPClient 服务
  - [ ] 实现 MCP 协议解析
  - [ ] 创建 MCPConfigPanel

## 商业化

- [ ] 实现用量统计
  - [ ] 创建 UsageDashboard
  - [ ] 实现 Token 计数
  - [ ] 创建用量图表

- [ ] 实现付费系统
  - [ ] 创建 SubscriptionPage
  - [ ] 集成 Stripe
  - [ ] 实现订阅状态管理

## 其他

- [ ] 实现国际化
  - [ ] 安装 i18next
  - [ ] 提取所有文本
  - [ ] 创建语言切换器

- [ ] 实现 PWA
  - [ ] 配置 Service Worker
  - [ ] 实现离线缓存
  - [ ] 添加推送通知
```

---

## 六、技术选型建议

| 领域       | 推荐方案                      | 原因                   |
| ---------- | ----------------------------- | ---------------------- |
| 虚拟滚动   | react-window                  | 成熟稳定，支持动态高度 |
| 数据同步   | React Query + IndexedDB       | 离线优先，服务端同步   |
| Markdown   | react-markdown + remark-gfm   | 更灵活的插件生态       |
| 国际化     | i18next                       | React生态首选          |
| PWA        | Vite PWA Plugin               | 构建时自动生成SW       |
| 用户认证   | Firebase Auth / Supabase Auth | 快速集成OAuth          |
| 后端框架   | NestJS / Fastify              | TypeScript友好         |
| 向量数据库 | Supabase pgvector / Qdrant    | 易于集成               |
| 代码沙箱   | Docker + Piston API           | 多语言支持             |

---

## 附录：参考产品对比

| 功能              | ChatGPT | Claude         | Cursor   | 本项目现状  |
| ----------------- | ------- | -------------- | -------- | ----------- |
| 多会话管理        | ✅      | ✅             | ✅       | ✅          |
| 流式响应          | ✅      | ✅             | ✅       | ✅          |
| 消息编辑/重新生成 | ✅      | ✅             | ✅       | ✅          |
| Function Calling  | ✅      | ✅             | ✅       | ❌          |
| 代码执行沙箱      | ✅      | ❌             | ✅       | ❌          |
| 语音交互          | ✅      | ❌             | ✅       | ❌          |
| 知识库/RAG        | ❌      | ✅ (Projects)  | ✅       | ❌          |
| 分享协作          | ✅      | ✅ (Artifacts) | ❌       | ❌          |
| 插件系统          | ✅      | ❌             | ✅ (MCP) | ❌          |
| 用户登录          | ✅      | ✅             | ✅       | ❌          |
| 数据同步          | ✅      | ✅             | ✅       | ❌ (仅本地) |

---

> **文档维护说明**：本规划文档应随项目迭代持续更新。已完成的功能请标记 ✅，新增需求请追加到相应章节。
