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
