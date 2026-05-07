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
    - CSS 隔离
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
13. AI Agent（智能体）在前端的表现形式有哪些？前端如何配合 Agent 完成复杂任务？
  - Agent 在前端的表现形式包括聊天窗口、任务步骤面板、工具调用日志、计划列表、审批确认、工作区和后台任务进度。前端配合 Agent 的关键是把用户目标和页面上下文结构化传给后端，实时展示计划、步骤、工具调用和中间结果，支持取消、重试、确认和恢复，并把最终结果做成可追溯、可解释、可操作的 UI。Agent 越复杂，前端越不能只是展示文本，而要成为任务执行过程的可视化和控制层。
14. 谈谈你对“生成式 UI”（Generative UI）的理解，以及它对前端开发的潜在影响。
  - 生成式 UI 是 AI 根据用户意图动态生成结构化界面，而不是只返回文本。它对前端的影响是，前端不再只写固定页面，而要建设一套可被 AI 安全调用的组件协议、schema 校验、设计系统和渲染引擎。前端的核心价值会从“写页面”转向“定义组件能力边界、保证安全、性能、权限和体验一致性”。AI 可以决定展示什么，但前端必须决定它能展示什么、怎么展示、哪些操作被允许。
15. 在过去的一年里，你在 AI前端领域遇到过最难的技术挑战是什么？你是如何解决的？
  - 我遇到最难的挑战是 AI 流式输出和复杂 Markdown/长会话渲染叠加导致的交互卡顿。解决方案是把问题拆成协议层、请求生命周期、渲染层和工程化保障：协议层用 fetch stream + buffer 正确处理 SSE 分包粘包；请求层用 AbortController 支持中断和清理；渲染层用批量更新、frameYield、memo、懒加载和动态高度虚拟列表降低重渲染；工程上增加流式协议、长文本渲染和 bundle 预算检查，防止后续回归。
16. 面对快速迭代的 AI技术，你平时是如何保持技术敏感度并进行学习的？
  - 关注官方文档，订阅一些公众号、AI新闻等。
  - 对新模型、新 SDK、新协议先做最小 demo
  - 把验证有效的能力沉淀到项目中
17. TypeScript 中的 Interface 和Type 有什么区别？在定义AI 接口返回数据时你倾向于用哪个？
  - interface 和 type 都可以描述对象结构
  - interface支持继承，同名自动合并
  - type能表示更复杂的类型，支持联合类型、交叉类型等
  - 结论：AI 接口返回数据里，我会用 interface 描述稳定的数据结构，用 type 描述联合状态和复杂组合。配合使用。
18. 说一下 CSS 中实现水平垂直居中的几种方式，并说明在 AI对话框布局中哪种更推荐？
  - flex、grid、position + transform、margin: auto
  - 最推荐flex，兼容性好，支持动态变化。
19. 请手写一个基础的防抖（Debounce）函数，并解释它在AI搜索建议场景下的作用
  - 事件频发时，只在最后一次触发后等待一段时间再执行。
  - 代码：
    ```ts
    function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
      let timer: ReturnType<typeof setTimeout> | null = null;

      return function(...args: Parameters<T>) {
        if(timer) {
          clearTimeout(timer)
        }

        timer = setTimeout(() => {
          fn(...args)
        }, delay)
      }
    }
    ```
  - 作用：减少请求次数，减轻服务端压力，提升体验（只对用户停顿后的关键词生成建议）


# 浏览器与 JS 底层
1. 请简单介绍一下你对 ES6 中 Promise 的理解，以及它如何解决回调地狱问题？
  - Promise 是异步编程的一种解决方案，有三种状态：pending（进行中）、fulfilled（已成功）和 rejected（已失败）。
  - 通过链式调用、try/catch 统一错误处理，避免回调地狱
2. Event Loop、宏任务、微任务、浏览器渲染之间是什么关系？
  - Event Loop 负责协调 JS 执行、异步任务和浏览器渲染。一次循环中，浏览器先执行一个宏任务，然后清空当前产生的所有微任务，之后如果需要并且时机合适才进行渲染。微任务优先级高于下一个宏任务，也通常早于浏览器渲染，所以大量微任务可能阻塞渲染，导致页面卡顿
  - 宏任务：script 整体代码、setTimeout、setInterval、postMessage、MessageChannel、UI event
  - 微任务：Promise.then / catch / finally、queueMicrotask、MutationObserver
  - requestAnimationFrame：通常在下一帧渲染前执行，适合做动画和读取布局相关操作，不应简单等同于宏任务
  - 示例
    ```js
    console.log('script start')

    setTimeout(() => {
      console.log('setTimeout')
    }, 0)

    Promise.resolve().then(() => {
      console.log('promise')
    })

    console.log('script end')
    ```
  - 输出结果：
    ``` text
    script start
    script end
    promise
    setTimeout
    ```
3. requestAnimationFrame、requestIdleCallback、setTimeout 的区别是什么？
4. 浏览器从输入 URL 到页面展示发生了什么？
5. V8 垃圾回收机制是什么？前端常见内存泄漏场景有哪些？
6. 原型链、作用域链、闭包、this 绑定分别解决什么问题？
7. Promise.all、Promise.allSettled、Promise.race、Promise.any 有什么区别？
8. async/await 的错误处理方式有哪些？如何避免未捕获异常？
9. 深拷贝和浅拷贝的区别是什么？structuredClone 有哪些限制？
10. ES Module 和 CommonJS 有什么区别？

# Vue
1. Vue 3 响应式原理是什么？reactive、ref、effect 如何配合依赖收集？
2. Vue 2 和 Vue 3 响应式实现有什么差异？
3. computed 和 watch 的区别是什么？computed 为什么有缓存？
4. Vue 组件更新流程是什么？nextTick 的原理是什么？
5. Vue Diff 算法的核心策略是什么？
6. keep-alive 的原理和使用场景是什么？
7. Vue 组件通信方式有哪些？大型项目中如何选择？
8. Pinia 和 Vuex 的区别是什么？如何设计大型业务模块的状态管理？
9. Vue 项目性能优化手段有哪些？
10. Vue 项目中如何做权限控制、路由守卫和动态菜单？

# React
1. React Fiber 架构为什么能中断、恢复和调度？
2. React Diff 算法的核心策略是什么？
3. useEffect 和 useLayoutEffect 有什么区别？
4. Hooks 为什么不能写在条件语句或循环里？
5. React 闭包陷阱和状态更新陷阱如何处理？
6. React.memo、useMemo、useCallback 分别适合什么场景？
7. 受控组件和非受控组件有什么区别？
8. React 并发特性对复杂前端应用有什么价值？
9. React 中如何优化长列表、复杂表单和高频更新？
10. React 项目中如何设计可维护的状态管理方案？

# TypeScript
1. interface 和 type 有什么区别？分别适合什么场景？
2. unknown、any、never 有什么区别？
3. 泛型约束、条件类型、映射类型分别怎么用？
4. 如何设计一个类型安全的接口请求 SDK？
5. 如何给 AI 流式响应设计类型？
6. 联合类型和交叉类型的区别是什么？
7. 类型守卫有哪些写法？实际项目中如何使用？
8. as const、typeof、keyof、infer 分别有什么作用？
9. 如何封装一个类型安全的事件总线？
10. 如何降低大型 TypeScript 项目的类型复杂度和编译成本？

# 工程化
1. Vite 为什么开发环境比 Webpack 快？
2. Webpack 的 Loader 和 Plugin 有什么区别？
3. Tree Shaking 生效条件是什么？
4. 如何分析和优化前端 bundle 体积？
5. Monorepo 如何设计包依赖、构建缓存和版本管理？
6. CI/CD 中前端质量门禁应该包含哪些？
7. Source Map 在生产环境如何安全使用？
8. 前端项目如何做环境变量、构建配置和发布配置管理？
9. 如何设计组件库的构建、文档、测试和发布流程？
10. 如何做前端灰度发布、回滚和线上问题追踪？

# 性能优化
1. 首屏性能优化完整链路是什么？
2. LCP、INP、CLS 分别代表什么？如何优化？
3. 如何定位页面卡顿？Performance 面板重点看哪些信息？
4. 长列表、复杂表格、图表页面如何优化？
5. 如何避免高频状态更新导致渲染阻塞？
6. HTTP 缓存、Service Worker、内存缓存、本地缓存分别适合什么场景？
7. 图片资源如何优化？懒加载、预加载、响应式图片怎么做？
8. 大型 SPA 如何优化路由切换速度？
9. 如何减少主线程阻塞？Web Worker 适合处理什么问题？
10. 前端性能监控体系应该采集哪些指标？

# 安全
1. XSS、CSRF、点击劫持分别是什么？如何防御？
2. 前端如何安全处理 Markdown 和 HTML 渲染？
3. token 存在 localStorage、cookie、内存中的取舍是什么？
4. CSP 是什么？如何配置？
5. AI 应用中 Prompt Injection 在前端侧能做哪些防护？
6. 如何防止接口越权？前端权限控制和后端权限控制的边界是什么？
7. 文件上传有哪些安全风险？前端可以做哪些校验？
8. 如何处理第三方脚本带来的安全风险？
9. SameSite、HttpOnly、Secure 分别有什么作用？
10. 前端如何避免敏感信息泄露到日志、埋点和 Source Map？

# 网络与协议
1. HTTP/1.1、HTTP/2、HTTP/3 有什么区别？
2. WebSocket、SSE、Long Polling 有什么区别？
3. 浏览器跨域原理是什么？CORS 预检请求什么时候发生？
4. CDN 缓存策略如何设计？
5. 大文件上传、断点续传、分片上传怎么实现？
6. TCP 和 UDP 的区别是什么？QUIC 解决了什么问题？
7. HTTPS 握手过程是什么？
8. 强缓存和协商缓存有什么区别？
9. 前端如何处理接口取消、超时、重试和并发控制？
10. 如何设计一个稳定的前端请求层？

# 架构设计
1. 如何设计一个中后台权限系统？
2. 如何设计一个低代码或可视化搭建平台？
3. 如何设计一个组件库？
4. 如何设计一个埋点 SDK？
5. 如何设计一个微前端主应用框架？
6. 如何设计 AI Chat 的会话、消息、工具调用、引用溯源模型？
7. 如何设计一个可扩展的表单引擎？
8. 如何设计一个前端错误监控 SDK？
9. 如何设计一个支持多租户、多主题、多语言的前端架构？
10. 如何设计复杂业务系统的模块边界和数据流？

# 项目复盘
1. 你负责过最复杂的前端项目是什么？
2. 你做过哪些性能优化？量化收益是多少？
3. 遇到过最难排查的线上问题是什么？如何定位和修复？
4. 你如何推动团队代码质量提升？
5. 你如何做技术选型？
6. 你如何平衡业务速度和技术债？
7. 你如何评估一个重构是否值得做？
8. 你如何设计前端项目的可观测性？
9. 你如何和后端、产品、设计协作解决复杂问题？
10. 你如何带新人或做技术分享？
