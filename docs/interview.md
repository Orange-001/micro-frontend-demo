# 微前端
1. 概念
一种多个团队独立发布功能的方式共同构建web应用的方案
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
  - 加载慢：qiankun的prefetch预加载。懒加载，gzip压缩

# Vite
1. CSS加载形式
  - 开发环境： 将CSS转JS，运行时插入 <style>。方便热更新
  - 生产环境： 把所有 CSS 抽离成独立文件， 构建时插入<link>到index.html
