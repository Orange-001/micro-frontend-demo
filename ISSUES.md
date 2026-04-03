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
