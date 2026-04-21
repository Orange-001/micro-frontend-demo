# 微前端：Vue + React（UnoCSS / Iconfont / Vite / Redux / Pinia / 路由 / Docker）

这是一个用于演示/落地的微前端工程：

- 容器（Host）：React + Redux + React Router
- 子应用（Vue）：Vue 3 + Pinia + Vue Router
- 子应用（React）：React + Redux + React Router

微前端加载采用 `qiankun`（并使用 `vite-plugin-qiankun`），确保本地可跑、线上也可部署。

## 快速开始

1. 安装依赖：`pnpm install`
2. 开发运行：`pnpm dev`
3. 构建：`pnpm build`
4. 容器预览：`pnpm preview`

## 微前端联动说明

- 容器 `apps/host`：使用 `qiankun` 注册两个子应用（`/vue` -> `vue-child`，`/react` -> `react-child`）
- 子应用 `apps/vue-child`：Vue 3 + `pinia` + `vue-router`（hash 路由）
- 子应用 `apps/react-child`：React 18 + `redux` + `react-router-dom`（hash 路由）

## Docker / Nginx 部署（本地联调）

1. 构建镜像：`docker compose build`
2. 启动服务：`docker compose up -d`
3. 访问：`http://localhost:8080/`

说明：`host` 构建时会注入 `VITE_VUE_ENTRY / VITE_REACT_ENTRY`，指向容器内的子应用服务名（便于线上部署时替换为真实域名）。
