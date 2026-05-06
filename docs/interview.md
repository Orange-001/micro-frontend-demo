# 微前端
1. 概念
  - 一种多个团队独立发布功能的方式共同构建web应用的方案
2. 方案对比
  - iframe
    - url同步问题：刷新后iframe url状态丢失（可以通过postMessage同步，或者URL映射，/main?subApp=/chat?id=123）
    - 加载慢：每次都是类似打开一个新网页，即使有缓存也达不到SPA切换体验
    - UI不同步：无法跨iframe操作DOM，UI是连续渲染而postMessage是离散事件。全局弹窗（能解决但割裂）、拖拽事件（无法解决）
    - 上下文隔离：数据无法共享，postMessage只是复制（序列化/反序列化），需要自己写状态同步机制。
  - js沙箱（qiankun）
    - 本质：应用加载器 + 沙箱隔离 + 生命周期管理
    - 应用加载器
      - 主应用通过import-html-entry加载子应用html，提取css插入style标签，单独执行js。
    - 沙箱隔离：window变量通过proxy代理，子应用卸载时清空代理。
    - 生命周期管理：通过监听路由（window.addEventListener('popstate', reroute)），以及子应用导出生命周期钩子，来确定子应用首次加载、挂载、卸载、更新。
    - CSSyandle
    - experimentalStyleIsolation：类似vue scoped。子应用容器打上data-v属性
    - strictStyleIsolation：Shadow DOM，类似iframe（区别在于Shadow DOM没有js隔离，共享window），外面进不来，里面出不去
  - 遇到的问题
    - 样式冲突：qiankun样式隔离，vue scoped, styled-components
    - 通信：eventbus
    - 加载慢：qiankun的prefetch预加载。路由懒加载，gzip压缩，子应用拆包（code splitting）
3. 应用通信
  - props 传递（主 → 子）
  - 全局状态（qiankun 官方）
  - eventBus（mitt / window）
  - postMessage（iframe 场景）
  - 👉 推荐：
    - 低频数据 → 全局状态
    - 高频事件 → eventBus

# Vite
1. CSS加载形式
  - 开发环境： 将CSS转JS，运行时插入 \<style>。方便热更新
  - 生产环境： 把所有 CSS 抽离成独立文件， 构建时插入\<link>到index.html

# AI
1. 如果要从零设计一个类似 ChatGPT 的Web 客户端架构，你会如何选型和分层？
  - 技术选型
    - React、React-Markdown、Vite、Fetch+SSE
  - 架构分层
    ```text
    UI层
      ↓
    页面层（Page）
      ↓
    业务层（Chat Domain）
      ↓
    状态层（Store、会话管理）
      ↓
    通信层（API / Stream）
      ↓
    基础设施层（Utils / Hooks / SDK）
    ```
  - 难点
2. 在处理 AI聊天的流式输出时，Fetch API 和传统的 XMLHttpRequest 有什么区别?
  - XHR
    - 回调形式；没有背压；依赖onprogress获取累计数据，没有chunk概念，对SSE没有边界，需要自己拆包
  - Fetch
    - 通过reader.read()主动拉取，可控；Promise；流式读取
  - backpressure(背压)：处理速度 < 数据到达速度
    - 如果没有会导致：数据一直来 → 内存堆积 → 页面卡顿甚至崩溃
3. 详细说明一下前端如何处理 SSE（Server-Sent Events）流式协议?
    ```text
    fetch 发起 stream 请求
      ↓
    response.body.getReader()
      ↓
    reader.read() 持续读取 Uint8Array
      ↓
    TextDecoder 转字符串
      ↓
    buffer 累积
      ↓
    按 \n\n 拆 SSE event
      ↓
    解析 data/event 字段
      ↓
    识别 [DONE] / error / JSON delta
      ↓
    yield text/reasoning chunk
      ↓
    React append 到当前消息
      ↓
    用户取消时 AbortController + reader.cancel()
    ```
4. AI 聊天应用中，长列表（对话历史）的渲染性能如何优化？
  - 控制重渲染范围： memo缓存组件、合并更新（避免每次token dispatch）
  - 控制DOM数量： 虚拟列表
    - 先根据每条消息预估高度或已测量高度，计算总高，用外层容器撑起滚动条
    - 滚动式根据scrollTop和容器高度（clientHeight）计算可视区域对应的消息索引范围，并额外渲染上下少量 overscan 缓冲项
    - 真正渲染的消息项使用绝对定位放到它在完整列表中的 offsetTop 位置
    - 由于聊天消息高度不固定，消息渲染后再通过 ResizeObserver 测量真实高度并缓存，后续重新计算总高度和偏移量
    - 索引计算
      - 二分法(>>1，取下)
      - startIndex = 【查找第一个 offset > scrollTop - overscanTop 的索引】 - 1
      - endIndex = 【查找最后一个 offset < scrollTop + containerHeight + overscanBottom 的索引】+ 1
    - 核心变量
      - itemCount：消息总数
      - estimatedItemHeight：消息预估高度，未测量前用于计算总高度和偏移量
      - heightCache：每条消息的真实高度缓存
      - scrollTop：当前滚动距离
      - containerHeight / clientHeight：可视区域高度
      - overscan：可视区域上下额外渲染的缓冲项数量
      - offsets：每条消息距离列表顶部的偏移量数组
      - totalHeight：所有消息高度之和，用来撑起完整滚动条
      - startIndex / endIndex：当前需要渲染的消息范围
      - visibleItems：最终要渲染的虚拟项列表
      - offsetTop：虚拟项在完整列表中的真实位置，用于绝对定位
5. 谈谈 React Fiber 架构的设计思想，它对AI应用的交互体验有什么帮助？
  - 设计思想
    - 可分片，可中断，可恢复，优先级调度。
  - 帮助：
    1. 流式输出时，减少 token 更新对输入和点击的阻塞
    2. 长列表和复杂 Markdown 渲染时，让页面保持可交互
    3. 在高频更新场景下，通过调度和批处理减少无效渲染
6. 如何在前端实现Markdown 的实时渲染，并支持代码高亮和数学公式？
  - 可以用react-markdown解析，通过remark-highlight支持高亮，remark-math+rehype-katex支持数学公式
  - 流式渲染时可以先不展示高亮和数学公式，等数据全部渲染完成后再展示。避免每个token都重新解析整段内容。
7. 如何处理 AI接口的超时和重试机制的？
  - 策略：AI 接口超时（setTimeout）一般用 AbortController 控制请求生命周期，并在 SSE 场景下额外调用 reader.cancel() 释放流读取；重试一般用指数退避 + jitter（delay = baseDelay * 2^attempt + jitter
），只对网络错误、超时、429、5xx 这类可恢复错误重试
8. 如何评估和优化 AI应用的加载性能和交互延迟？
  - 核心指标

    | 指标 | 含义 | 关注点 |
    |---|---|---|
    | FCP | 首次内容绘制 | 页面是否尽快有内容 |
    | LCP | 最大内容绘制 | 首屏主体内容是否快 |
    | TTI / INP | 可交互延迟 | 输入框、按钮是否卡顿 |
    | JS Bundle Size | JS 体积 | 是否影响首屏加载 |
    | TTFB | 首字节时间 | 服务端响应速度 |
    | Time to First Token | 用户发问到第一个 token 出现 | AI 应用最关键指标 |
    | Tokens/sec | 输出速度 | 模型流式响应体验 |
    | End-to-End Latency | 从提交到完整回答结束 | 总体响应耗时 |
    | Tool Call Latency | 工具调用耗时 | RAG、搜索、函数调用是否慢 |
    | Render Latency | token 到达后渲染到页面耗时 | Markdown、代码高亮、图表是否卡 |
  - 评估手段
    - 前端：Chrome DevTools Performance/Network、Lighthouse、bundle analyzer
    - 链路埋点：点击发送 → 请求发出 → 首 token 返回 → 首 token 渲染 → 回复完成
    - 后端 trace：鉴权、上下文构造、RAG 检索、工具调用、模型排队、模型生成、落库分别打点
  - 优化方案
    - 加载：路由懒加载、拆包、按需加载 Markdown/Mermaid/KaTeX/Monaco、静态资源强缓存、减少首屏同步逻辑
    - 首 token：流式响应（SSE/ReadableStream）、缩短 prompt、裁剪上下文、RAG 缓存、工具调用并行、模型连接复用
    - 渲染：token 批量更新（requestAnimationFrame/节流）、长会话虚拟列表、消息组件 memo、输出完成后再做代码高亮/公式渲染
    - 体验：发送后立即乐观展示用户消息和 assistant 占位，用快模型处理简单任务，慢工具调用给明确 loading 状态
9. 什么是闭包？在开发AI相关的Hooks 或工具函数时，闭包通常用来做什么？
  - 概念：函数可以访问并记住创建它时所在作用域里的变量，即使函数在外部异步执行也能继续使用这些变量
  - 应用
    - 保存请求上下文：如 `AbortController`，`sendMessage` 创建，`stopStreaming` 中断
    - 保存流式状态：如 SSE `buffer`、`isInReasoning`、是否收到首 token
    - 保存定时器：如 `debounce` 的 `timer/lastArgs`，避免频繁搜索或写入
10. 介绍一下 RAG（检索增强生成）在前端侧可以参与哪些工作？
  - RAG 的核心检索和生成通常在后端，但前端可以参与查询增强、上下文收集、文件上传、检索范围选择、引用展示、溯源交互、检索过程可视化、用户反馈和缓存优化。前端的重点不是做 embedding，而是把用户上下文传准确，把检索过程和证据展示清楚，并形成反馈闭环
11. 在构建 AI 应用时，如何设计一个可扩展的 Prompt 模板引擎？
  - 支持变量系统、条件渲染、循环渲染、版本管理、插件化扩展。
  - 主要是通过正则实现
12. 谈谈前端工程化中，针对 AI 项目有哪些特殊的 CI/CD 或监控指标？
  - AI 项目的前端 CI/CD 除了常规构建、测试和部署，还要把 Prompt、模型配置、流式协议、长文本渲染和 bundle 预算纳入质量门禁。监控上除了 Web Vitals，还要重点看 Time to First Token、tokens/sec、端到端耗时、流式中断率、Prompt 版本、模型错误率、RAG/工具调用耗时以及 Markdown 渲染性能。AI 应用的问题往往不是页面挂了，而是“首 token 慢、流断了、引用错了、长文本卡了”，所以指标要围绕这些链路设计。
