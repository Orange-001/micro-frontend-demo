# 开发问题记录

## 1. Dockerfile COPY 路径错误

**现象**：`docker compose up --build` 构建失败

**原因**：三个 Dockerfile 中 `COPY ../../docker/nginx/spa.conf` 路径错误。Docker 的 `COPY` 路径相对于 build context（项目根目录），不是 Dockerfile 所在位置。

**修复**：改为 `COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf`

---

## 2. Docker 构建缺少 tsconfig.base.json

**现象**：`vite build` 报错 `failed to resolve "extends":"../../tsconfig.base.json"`

**原因**：Dockerfile 的 `COPY` 没有包含根目录的 `tsconfig.base.json`，子应用的 `tsconfig.json` 通过 `extends` 引用了它。

**修复**：在 COPY 行追加 `tsconfig.base.json`：
```dockerfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
```

---

## 3. 子应用 entry 地址使用了 Docker 内部服务名

**现象**：浏览器控制台报 `GET http://vue-child/ net::ERR_NAME_NOT_RESOLVED`

**原因**：`docker-compose.yml` 中 `VITE_VUE_ENTRY` / `VITE_REACT_ENTRY` 设为 `http://vue-child/` 和 `http://react-child/`。这些是 Docker 内部 DNS 名称，仅容器间通信可用；qiankun 加载子应用是在**浏览器端**发起请求，浏览器无法解析这些名称。

**修复**：改为宿主机可访问的地址：
```yaml
VITE_VUE_ENTRY: "http://localhost:8081/"
VITE_REACT_ENTRY: "http://localhost:8082/"
```

---

## 4. 子应用 JS 资源路径解析到主应用域名

**现象**：`Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"`

**原因**：子应用 vite 配置 `base: '/'`，构建产物中资源路径为 `/assets/xxx.js`。qiankun 在主应用（8080）加载时，浏览器将其解析为 `http://localhost:8080/assets/xxx.js`，而该文件只存在于子应用服务器上。

**修复**：通过环境变量让子应用构建时使用绝对路径：
```ts
// vite.config.ts
base: process.env.VITE_APP_BASE || '/'
```
```yaml
# docker-compose.yml
args:
  VITE_APP_BASE: "http://localhost:8081/"
```

---

## 5. 生产构建下子应用 CSS 样式不生效

**现象**：子应用的 `.page`、`.link` 等 `global.scss` 样式在 Docker 部署后不生效；`<a>` 标签显示浏览器默认蓝色/紫色而非白色。本地 dev 模式正常。

**原因**：生产构建时 vite 将 CSS 抽取为独立 `.css` 文件，通过 `<link>` 标签加载。qiankun 的 `experimentalStyleIsolation` 无法正确处理子应用的外部 `<link>` 样式表。而 dev 模式下 vite HMR 通过内联 `<style>` 注入 CSS，所以不受影响。

**修复**：安装 `vite-plugin-css-injected-by-js`，强制 CSS 通过 JS 以 `<style>` 标签注入，绕过 `<link>` 加载问题：
```ts
// vite.config.ts
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    // ...其他插件
    cssInjectedByJsPlugin()
  ]
});
```

---

## 6. 子应用 @font-face 被 qiankun 样式隔离 scope 后字体不加载

**现象**：子应用（react-child / vue-child）的 iconfont 图标不显示，host 主应用的图标正常。

**原因**：qiankun 启用了 `experimentalStyleIsolation: true`，会给子应用 CSS 加上作用域前缀（如 `div[data-qiankun-react-child]`）。`@font-face` 是全局声明，不支持被 scope，浏览器直接忽略被包裹后的 `@font-face`，导致字体文件不加载。此外，即使手动注入 `@font-face`，Vite 的静态资源 import 返回的是相对路径（如 `/src/assets/iconfont/iconfont.woff2`），在 qiankun 环境下会解析到主应用域名而非子应用的 dev server，同样导致 404。

**修复**：用 `new URL(path, import.meta.url).href` 获取包含子应用 origin 的绝对 URL，然后在 `render()` 中手动创建 `<style>` 注入到 `document.head`，绕过 qiankun 的样式隔离：
```ts
// 在模块顶层获取绝对 URL
const woff2Url = new URL('./assets/iconfont/iconfont.woff2', import.meta.url).href;
const woffUrl = new URL('./assets/iconfont/iconfont.woff', import.meta.url).href;
const ttfUrl = new URL('./assets/iconfont/iconfont.ttf', import.meta.url).href;

let fontStyleEl: HTMLStyleElement | null = null;

function render(props: any) {
  // ...
  if (!fontStyleEl) {
    fontStyleEl = document.createElement('style');
    fontStyleEl.setAttribute('data-mfe-style', 'xxx-iconfont');
    fontStyleEl.textContent = `
@font-face {
  font-family: "xxx-iconfont";
  src: url('${woff2Url}') format('woff2'),
       url('${woffUrl}') format('woff'),
       url('${ttfUrl}') format('truetype');
}`;
    document.head.appendChild(fontStyleEl);
  }
}

// unmount 时移除
function unmount() {
  fontStyleEl?.parentNode?.removeChild(fontStyleEl);
  fontStyleEl = null;
}
```

---

## 7. 推理模型（Qwen/DeepSeek/Gemini）流式输出时 thinking 阶段无内容显示

**现象**：使用 `qwen/qwen3-plus` 等带推理能力的模型时，发送消息后前面很长一段时间页面无任何文字输出，等到 thinking 结束开始输出正文后才突然显示内容。

**原因**：这类模型在 thinking 阶段，SSE delta 返回的是 `reasoning_content` 或 `reasoning` 字段而非 `content` 字段。且 Qwen 会同时返回 `content: ""` （空字符串）和 `reasoning: "实际内容"`。

原来的 `parseSSEEvent` 只检查 `delta.content !== undefined && delta.content !== null`，空字符串 `""` 通过了此检查，直接返回空文本 chunk，`reasoning` 分支永远不会执行。thinking 阶段的所有内容被静默丢弃。

```json
// Qwen SSE delta 示例
"delta": {
  "content": "",
  "role": "assistant",
  "reasoning": " management)\n  "
}
```

**修复**：
1. `streamingService.ts` — `parseSSEEvent` 中将 `reasoning` 检查移到 `content` 之前，并改用 truthiness 检查（`if (reasoning)` / `if (delta.content)`），空字符串自动被过滤
2. `types/chat.ts` — `StreamChunk.type` 增加 `'reasoning'` 类型
3. `useStreamingResponse.ts` — 新增 `reasoning` chunk 处理逻辑，将思考内容用 Markdown blockquote 展示，thinking 结束后插入分隔线再输出正文

---

## 8. Markdown 代码块中 rehype-highlight 导致 [object Object] 输出

**现象**：代码块内容显示为 `[object Object]` 而非正常代码文本。

**原因**：`rehype-highlight` 将代码转换为 `<span>` 元素树（React 元素），`CodeBlock` 组件直接对 `children` 调用 `String()` 得到 `[object Object]`。

**修复**：在 `MarkdownRenderer.tsx` 中新增 `extractText()` 递归函数，从 React 元素树中提取纯文本后再传给 `CodeBlock`。

---

## 9. Mermaid 图表中文/混合文本被截断

**现象**：Mermaid 流程图节点标签文字不完整，如 `输入年份 year` 只显示 `输入年份 ye`，`year % 4 == 0?` 只显示 `year % 4 ==`。

**原因**：`mermaid.initialize()` 使用了 `securityLevel: 'strict'`，该模式会强制 `htmlLabels = false`，使 Mermaid 用 SVG `<text>` 元素渲染标签。SVG 文本测量对中文和中英混排文本宽度计算不准确，导致节点框比实际文字窄，文本被裁切。

**修复**：将 `securityLevel` 改为 `'loose'`，使 `htmlLabels: true`（默认值）生效。Mermaid 改用 `<foreignObject>` + HTML 布局，由浏览器原生排版引擎计算文字宽度，中文和混合文本测量准确。

---

## 10. scroll-behavior: smooth 导致异步内容渲染后无法自动滚底

**现象**：页面刷新后，包含 Mermaid 图表的对话没有滚动到底部。

**原因**：`MessageList` 的滚动容器设置了 `scroll-behavior: smooth`。当 `scrollToBottom()` 设置 `el.scrollTop = el.scrollHeight` 后，平滑滚动动画期间会持续触发 scroll 事件。scroll 事件处理函数检测到 `scrollHeight - scrollTop - clientHeight > 50`（动画还没滚到底），将 `userScrolledRef` 设为 `true`。随后 Mermaid 异步渲染完成，`ResizeObserver` 触发 `scrollToBottom()`，但因 `userScrolledRef === true` 而跳过滚动。

**修复**：新增 `isProgrammaticScroll` ref 标记程序触发的滚动。`scrollToBottom()` 调用时设为 `true`，500ms 后（smooth 动画结束）恢复 `false`。scroll 事件处理函数在 `isProgrammaticScroll === true` 时直接 return，不更新 `userScrolledRef`。同时用 `ResizeObserver` 监听内容区高度变化，替代自定义事件，确保任何异步内容（Mermaid、图片等）渲染后都能触发滚底。

---

# 微前端架构与样式方案评估记录

## 1. 总体判断

当前项目是一个 `qiankun + Vite + React host + React/Vue child` 的微前端项目。它已经能跑通主应用加载 React/Vue 子应用的基础链路，但从长期维护、独立部署、样式隔离、应用契约、运行时治理等角度看，初始状态更接近“实验型拼装”，还没有形成完整的微前端工程体系。

核心问题不在于单个技术栈选择错误，而在于缺少统一的跨应用契约：应用注册、路由、资源 `base`、样式隔离、主题 token、弹层挂载、共享依赖、通信协议、部署 manifest 等能力分散在各应用中，随着子应用数量增加会明显放大维护成本。

## 2. 当前项目曾存在的主要问题

### 2.1 微前端接入问题

1. **应用注册硬编码**
   - 子应用 `name`、`entry`、`container`、`activeRule` 直接写在 host 的注册逻辑中。
   - 缺少统一 manifest，后续新增子应用、灰度、版本回滚、按环境切换都会比较困难。

2. **路由契约不清晰**
   - 主应用使用 `BrowserRouter`，子应用曾使用 `HashRouter` / `createWebHashHistory` 规避路径冲突。
   - Hash 路由虽然简单，但 URL 语义、深链、权限、菜单、面包屑、监控统计都会变弱。
   - 更合理的方式是 host 管一级路由，子应用基于 host 下发的 `basename` 管二级路由。

3. **子应用挂载容器复用风险**
   - React/Vue 子应用共用同一个 `#micro-viewport` 容器。
   - 如果生命周期处理不严格，可能出现旧 DOM 残留、样式残留、事件残留等问题。
   - 子应用应该在 qiankun 提供的 container 内创建自己的稳定根节点，并在卸载时完整清理。

4. **生命周期存在 DOM 副作用**
   - 子应用挂载时曾直接操作 `container.innerHTML`。
   - 这种方式绕过 React/Vue 生命周期，容易掩盖卸载残留和状态污染问题。
   - 更推荐使用 `container.replaceChildren(root)` 创建独立 mount root，并在 `unmount` 中移除。

5. **生产环境资源路径易错**
   - 子应用构建时如果 `base` 配置不正确，JS/CSS/字体资源会被解析到 host 域名。
   - qiankun 加载子应用是在浏览器端执行，请求地址必须是浏览器可访问地址，而不是 Docker 内部服务名。

6. **缺少加载治理**
   - 初始方案缺少加载失败页、超时控制、版本标识、灰度、回滚、监控埋点。
   - 生产级微前端应对每个子应用加载和生命周期阶段做可观测性建设。

### 2.2 样式方案问题

1. **样式体系过多且边界不清**
   - 项目同时存在 SCSS、styled-components、UnoCSS、Ant Design CSS-in-JS、Element Plus CSS、KaTeX/highlight 第三方 CSS。
   - 多套样式方案并存不是问题，但必须有明确职责边界，否则会出现优先级冲突、全局污染和调试困难。

2. **全局选择器污染风险**
   - Host 曾直接设置 `body`、`*` 等全局样式。
   - 子应用也引入各自的 `global.scss`、`uno.css`、iconfont CSS。
   - 在微前端中，全局样式应尽量限制在应用根容器下，避免影响其他应用。

3. **缺少统一设计 token**
   - 颜色、间距、圆角、字体、阴影等样式值分散在各应用中。
   - 这会导致 host 和子应用视觉不一致，也不利于主题切换。
   - 更合理的是通过 shared CSS variables 提供统一 token。

4. **组件库弹层挂载风险**
   - Ant Design、Element Plus 的 Modal、Message、Popover 等弹层默认可能挂到 `document.body`。
   - 微前端场景下这会绕过子应用容器，造成样式隔离失效或 z-index 冲突。
   - 应统一配置 `getPopupContainer` / `appendTo` 到当前子应用容器。

5. **第三方 CSS 隔离不足**
   - Element Plus、KaTeX、highlight.js 等 CSS 默认是全局样式。
   - 如果直接全局注入，可能影响其他应用。
   - 应优先使用根命名空间、CSS Modules、scoped CSS、CSS-in-JS 或构建期 prefix 限定作用域。

6. **qiankun 样式隔离不是银弹**
   - `experimentalStyleIsolation` 可以缓解普通选择器污染，但对 `@font-face`、外部 `<link>`、部分第三方 CSS 并不完美。
   - 字体、弹层、全局 keyframes、第三方组件库样式都需要额外治理。

### 2.3 安全与工程治理问题

1. **Markdown raw HTML 风险**
   - React 子应用 Markdown 渲染曾启用 `rehypeRaw`。
   - 如果内容来自用户输入或模型输出，会增加 XSS 风险。
   - 应关闭 raw HTML，或引入严格 sanitize 白名单。

2. **共享层太薄**
   - 初始 shared 包几乎只承载 iconfont，缺少微前端契约。
   - 微前端项目中 shared 层应至少承载应用 manifest、运行时 props 类型、主题 token、通信事件类型等稳定协议。

3. **包体积治理不足**
   - React 子应用包含 Mermaid、KaTeX、highlight 等重依赖。
   - Vue 子应用也存在较大 chunk。
   - 应通过 `dynamic import`、`manualChunks`、按路由拆包、按需加载来优化首屏。

## 3. 优秀的微前端方案应该是什么样

### 3.1 应用注册中心化

应使用类型化 manifest 管理子应用信息，包括：

- `name`：子应用唯一名称
- `title`：展示名称
- `entry` / `envEntryKey`：不同环境入口
- `activeRule` / `basename`：路由边界
- `containerId`：挂载容器
- `version`：发布版本
- `permissions`：权限声明
- `fallback`：加载失败降级策略

Host 不应该散落硬编码子应用配置，而应从 manifest 生成 qiankun 注册配置。

### 3.2 路由边界清晰

推荐路由职责划分：

- Host 负责一级路由、登录态、权限、菜单、布局、全局错误页。
- 子应用负责自身二级路由和业务页面。
- Host 通过 props 下发 `basename`，子应用使用 `BrowserHistory + basename`。
- 只有在静态部署强约束或老系统接入时，才优先考虑 hash 路由。

### 3.3 通信契约类型化

跨应用通信应遵循“少共享、强契约”的原则：

- 不建议直接共享 Redux/Pinia store。
- 推荐共享稳定上下文，如用户、语言、主题、权限、导航状态。
- 使用类型化 event bus、shared SDK 或 qiankun props。
- 事件名称、payload、返回值应在 shared 包中声明类型。

### 3.4 独立构建与独立部署

每个子应用应具备完整独立发布能力：

- 独立 build
- 独立 Docker 镜像或静态资源产物
- 独立版本号
- 可回滚
- 可灰度
- 可被 host manifest 动态切换入口

Host 只负责编排，不应该强耦合子应用内部实现。

### 3.5 运行时隔离分级

不同业务按隔离强度选择方案：

1. **常规可信业务**：qiankun sandbox + 样式命名空间。
2. **强样式隔离业务**：Web Components / Shadow DOM。
3. **不可信或强安全边界业务**：iframe。
4. **同技术栈、强模块共享业务**：Module Federation。

不要把一种微前端技术当作所有场景的唯一答案。

### 3.6 生产可观测性

生产级微前端至少应记录：

- 子应用 entry 加载耗时
- bootstrap/mount/unmount 错误
- 静态资源加载失败
- 子应用版本号
- 路由切换耗时
- 白屏检测
- 降级和重试次数

## 4. 优秀的微前端样式方案应该是什么样

### 4.1 样式分层

推荐样式职责分层：

1. **Host 层**
   - 全局 reset
   - 页面背景
   - shell 布局
   - 主题 token 注入
   - 全局弹层基准 z-index

2. **Shared 层**
   - CSS variables 设计 token
   - 公共字体变量
   - 公共颜色、间距、圆角、阴影
   - 跨应用约定的 class name 常量

3. **子应用层**
   - 只负责自身容器内样式
   - 不直接修改 `body/html/*`
   - 不使用无前缀的通用类名污染外部

4. **组件层**
   - React 优先 CSS-in-JS / CSS Modules
   - Vue 优先 scoped CSS / CSS Modules
   - 复杂通用样式通过 token 组合，而不是复制硬编码值

### 4.2 统一设计 token

跨应用视觉一致性应基于 CSS variables，例如：

- `--mfe-font-family`
- `--mfe-bg-page`
- `--mfe-bg-card`
- `--mfe-text-primary`
- `--mfe-text-secondary`
- `--mfe-color-primary`
- `--mfe-radius-lg`
- `--mfe-space-md`
- `--mfe-shadow-card`

Token 应由 shared 包统一维护，host 和子应用共同消费。

### 4.3 根命名空间隔离

每个应用都应有稳定根 class：

- Host：`.mfe-shell`
- React 子应用：`.mfe-app-react-child`
- Vue 子应用：`.mfe-app-vue-child`

普通 SCSS/CSS 的选择器应尽量挂在应用根 class 下，避免 `.card`、`.title`、`.text` 这类通用类名泄漏到全局。

### 4.4 第三方组件库治理

第三方组件库应遵循：

- 弹层挂载到当前应用容器，而不是默认 `document.body`。
- 组件库主题由当前应用配置，但 token 来源尽量统一。
- 全局 CSS 尽量做作用域限制。
- 无法作用域化的样式，需要在生命周期中明确注入和清理。

### 4.5 UnoCSS 使用边界

如果继续使用 UnoCSS，应明确规则：

- 所有应用使用同一 preset 和 theme。
- 避免不同应用生成语义不一致的同名 utility。
- 必要时配置 prefix 或 layer。
- 不把 UnoCSS 当作唯一设计系统，仍应以 token 为基础。

### 4.6 字体与 iconfont 治理

字体类资源在 qiankun 下需要特别处理：

- `@font-face` 是全局声明，不能完全依赖样式 scope。
- 字体 URL 应使用 `new URL(path, import.meta.url).href` 获取子应用自身 origin 下的绝对地址。
- 注入到 `document.head` 的字体样式应带 `data-mfe-style` 标记，并在子应用卸载时清理。

## 5. 本轮整改方向记录

本轮整改遵循以下方向：

1. 将微前端应用配置抽到 shared manifest。
2. Host 基于 manifest 注册子应用，并统一下发 runtime props。
3. React/Vue 子应用改为基于 `basename` 的 browser history。
4. 子应用挂载时创建独立根节点，卸载时清理 DOM 和注入样式。
5. 新增 shared design tokens，通过 CSS variables 统一视觉基础。
6. Host、React 子应用、Vue 子应用样式都限制在各自根 class 下。
7. 组件库弹层挂载到子应用容器内。
8. 移除 Markdown raw HTML 渲染风险。
9. 保留 qiankun `experimentalStyleIsolation`，但不把它作为唯一样式隔离手段。

## 6. 子应用首次加载慢、挂载区域长时间空白

### 6.1 现象

发布或 Docker 生产构建后，首次从 host 进入 Vue / React 子应用时，子应用挂载区域会长时间停留在空白或 placeholder 状态。尤其 React 子应用依赖较重时，用户会误以为子应用加载失败。

### 6.2 原因判断

1. **缺少加载态反馈**
   - qiankun 加载子应用 entry、下载资源、执行脚本、mount 生命周期都需要时间。
   - 原实现没有接入 qiankun `loader`，加载期间 host 只能显示静态 placeholder，体验上接近“空白”。

2. **没有提前预加载子应用资源**
   - qiankun `prefetch` 曾设置为 `false`。
   - 用户点击 `/vue` 或 `/react` 后才开始请求子应用 HTML、JS、CSS 和字体资源，首次进入路径耗时更明显。

3. **React 子应用首包过大**
   - React 子应用包含 `react-markdown`、`remark`、`rehype`、`highlight.js`、`KaTeX`、`Mermaid`、Ant Design 等依赖。
   - 如果这些依赖全部进入首包，浏览器需要先下载、解析、执行大量 JS，mount 时间会明显变长。

4. **Vue 子应用组件库全量引入**
   - Vue 子应用只使用了 `ElButton` 和 `ElMessage`，但之前通过 `app.use(ElementPlus)` 全量注册 Element Plus。
   - Element Plus 全量包会放大子应用首次下载和执行成本。

5. **路由页面缺少代码分割**
   - React / Vue 子应用页面如果静态导入，首屏会加载所有页面代码。
   - 对微前端来说，子应用 entry 越轻，越能缩短首次 mount 的等待时间。

### 6.3 优秀方案

1. **加载态必须由 host 兜底**
   - host 应接入 qiankun `loader(loading)`，在子应用资源加载和生命周期执行期间展示明确 loading UI。
   - loading UI 应放在子应用容器层，避免子应用尚未 mount 时无反馈。

2. **合理启用预加载**
   - 对常用子应用可使用 `prefetch: 'all'` 或自定义空闲预加载策略。
   - 如果子应用很多，应按业务优先级或用户行为预测预加载，避免一次性抢占首屏带宽。

3. **子应用 entry 保持轻量**
   - 子应用入口只放运行必需代码：框架启动、路由壳、状态初始化、基础样式。
   - 页面、复杂组件、富文本渲染器、图表库、编辑器等重模块应按需加载。

4. **路由级懒加载**
   - React 使用 `React.lazy + Suspense`。
   - Vue Router 使用 `component: () => import(...)`。

5. **重依赖按需加载**
   - Mermaid 只在遇到 Mermaid 代码块时 `dynamic import('mermaid')`。
   - Markdown / KaTeX / highlight 这类渲染链路应拆成独立 chunk。
   - Element Plus 按组件导入，避免全量组件库进入子应用首包。

6. **构建层做稳定分包**
   - 使用 Vite / Rollup `manualChunks` 将 framework、组件库、Markdown、Mermaid 等拆成可缓存 chunk。
   - 分包目标不是“文件越多越好”，而是让首入口更轻、重依赖可按需、公共依赖可长期缓存。

### 6.4 本次落地整改

1. **Host 加载态**
   - `apps/host/src/micro-apps.ts`：新增 `mfe:micro-app-loading` 事件，接入 qiankun `loader`。
   - `apps/host/src/App.tsx`：订阅加载事件，在微前端挂载区域展示 loading。
   - `apps/host/src/App.styles.ts`：新增 loading 遮罩和 spinner 样式。

2. **qiankun 预加载**
   - `apps/host/src/micro-apps.ts`：将 `prefetch: false` 调整为 `prefetch: 'all'`。
   - host 首屏稳定后，浏览器可提前拉取子应用资源，降低首次进入子路由的等待时间。

3. **React 路由懒加载**
   - `apps/react-child/src/App.tsx`：`ChatView`、`AboutView` 改为 `React.lazy`，并通过 `Suspense` 给页面级 fallback。

4. **Vue 路由懒加载**
   - `apps/vue-child/src/router/index.ts`：`HomeView`、`AboutView` 改为动态导入。

5. **Markdown 渲染链路拆分**
   - `apps/react-child/src/components/chat/MarkdownRenderer.tsx`：改为轻量懒加载壳。
   - `apps/react-child/src/components/chat/MarkdownContent.tsx`：承载原 Markdown / remark / rehype / KaTeX / highlight 渲染实现。

6. **Mermaid 按需加载**
   - `apps/react-child/src/components/chat/MermaidBlock.tsx`：移除静态 `import mermaid from 'mermaid'`，改为渲染图表时动态 import。
   - 只有消息内容真正包含 Mermaid 图表时才下载 Mermaid 大包。

7. **Element Plus 按需加载**
   - `apps/vue-child/src/main.ts`：只注册 `ElButton`。
   - `apps/vue-child/src/App.vue`：`ElMessage` 改为组件子路径导入。
   - Element Plus 样式只注入 base、button、message 相关 CSS。

8. **Vite 分包**
   - `apps/react-child/vite.config.ts`：拆分 `vendor-react`、`vendor-markdown`、`vendor-mermaid`。
   - `apps/vue-child/vite.config.ts`：拆分 `vendor-vue`、`vendor-element-plus`。

### 6.5 整改效果

1. Vue 子应用 Element Plus 相关 chunk 从全量约 `1.24MB` 降到按需约 `77.85KB`。
2. React 子应用入口 chunk 降到约 `55KB`，Markdown、Mermaid 等重依赖不再全部进入入口文件。
3. Mermaid 仍是较大的独立 chunk，但已经变成按需加载，不影响没有 Mermaid 图表的首屏挂载。
4. 子应用加载期间 host 会显示 loading，不再出现长时间无反馈的空白区域。
5. GitHub Pages / Docker 构建均可复用同一套优化策略。

### 6.6 后续可继续优化

1. **监控加载耗时**
   - 记录子应用 entry 下载、bootstrap、mount、首内容渲染耗时。

2. **加载失败 fallback**
   - 对子应用加载超时、资源 404、mount 异常提供错误页和重试按钮。

3. **更细的预加载策略**
   - 对首屏低优先级子应用可使用 `requestIdleCallback` 或基于 hover / viewport 的预加载。

4. **Mermaid 进一步拆分或降级**
   - 如果 Mermaid 使用频率低，可提供“点击渲染图表”模式，完全避免自动下载图表库。

5. **Docker 构建缓存优化**
   - 当前三个镜像分别执行依赖安装，后续可通过共享 base 镜像或多阶段缓存减少构建时间。

## 7. 后续建议

1. **引入运行时 manifest**
   - 当前 manifest 是编译期共享常量，后续可升级为远程 JSON manifest，支持动态切换 entry 和版本。

2. **完善加载失败处理**
   - 为子应用加载失败、超时、mount 异常增加 fallback UI。

3. **增加微前端监控**
   - 记录子应用加载耗时、错误、版本、资源失败等信息。

4. **拆分大包体积**
   - 对 Mermaid、KaTeX、highlight.js、Element Plus 等重依赖做懒加载和 manualChunks。

5. **继续收敛样式体系**
   - React 侧尽量统一 styled-components / CSS Modules。
   - Vue 侧尽量统一 scoped CSS / CSS Modules。
   - SCSS 只保留必要的应用级样式，不再扩散全局规则。

6. **补充端到端验证**
   - 使用 Playwright 验证 host 加载 Vue/React 子应用、路由深链、弹层挂载、卸载清理和样式隔离。
