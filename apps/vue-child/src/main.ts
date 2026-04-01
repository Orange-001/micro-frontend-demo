import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import App from './App.vue';
import router from './router';
import '@mfe/shared/iconfont.css';
import './assets/iconfont/iconfont.css';
import 'uno.css';
import './styles/global.scss';

const vcWoff2Url = new URL('./assets/iconfont/iconfont.woff2', import.meta.url).href;
const vcWoffUrl = new URL('./assets/iconfont/iconfont.woff', import.meta.url).href;
const vcTtfUrl = new URL('./assets/iconfont/iconfont.ttf', import.meta.url).href;
import ElementPlus from 'element-plus';
import elementPlusCss from 'element-plus/dist/index.css?inline';

let elementPlusStyleEl: HTMLStyleElement | null = null;
let vcFontStyleEl: HTMLStyleElement | null = null;

let app: ReturnType<typeof createApp> | null = null;

function render(props: any) {
  const container: HTMLElement = props?.container ?? document.getElementById('app')!;

  // qiankun 容器复用时需要清空，避免旧内容残留
  container.innerHTML = '<div style="padding:16px;opacity:.8">[vue-child] mount() called...</div>';

  // qiankun experimentalStyleIsolation 会 scope @font-face 导致字体加载失败；
  // 用 new URL + import.meta.url 获取绝对路径，手动注入全局 @font-face。
  if (!vcFontStyleEl) {
    vcFontStyleEl = document.createElement('style');
    vcFontStyleEl.setAttribute('data-mfe-style', 'vc-iconfont');
    vcFontStyleEl.textContent = `
@font-face {
  font-family: "vc-iconfont";
  src: url('${vcWoff2Url}') format('woff2'),
       url('${vcWoffUrl}') format('woff'),
       url('${vcTtfUrl}') format('truetype');
}`;
    document.head.appendChild(vcFontStyleEl);
  }

  // qiankun experimentalStyleIsolation 不支持 LINK 的 CSS 隔离；
  // 这里把 element-plus 的 CSS 以 STYLE 方式注入，并在卸载时移除，避免跨应用污染。
  if (!elementPlusStyleEl) {
    elementPlusStyleEl = document.createElement('style');
    elementPlusStyleEl.setAttribute('data-mfe-style', 'element-plus');
    elementPlusStyleEl.textContent = elementPlusCss as string;
    document.head.appendChild(elementPlusStyleEl);
  }

  app = createApp(App);
  app.use(createPinia());
  app.use(router);
  // 让子组件拿到当前 mount container，便于把 Message/Notification append 到正确的 DOM 节点
  app.provide('mfeMountContainer', container);
  app.use(ElementPlus);
  app.mount(container);
}

renderWithQiankun({
  bootstrap() {
    // qiankun 在 BOOTSTRAPPING 阶段会调用，必须存在
  },
  mount(props: any) {
    render(props);
  },
  unmount() {
    app?.unmount();
    app = null;
    if (vcFontStyleEl?.parentNode) {
      vcFontStyleEl.parentNode.removeChild(vcFontStyleEl);
    }
    vcFontStyleEl = null;
    if (elementPlusStyleEl?.parentNode) {
      elementPlusStyleEl.parentNode.removeChild(elementPlusStyleEl);
    }
    elementPlusStyleEl = null;
  },
  update() {},
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render({});
}
