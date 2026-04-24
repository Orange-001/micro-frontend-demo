import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import { MFE_VUE_CHILD_CLASS, type MicroAppRuntimeProps } from '@mfe/shared';
import App from './App.vue';
import { createAppRouter } from './router';
import '@mfe/shared/iconfont.css';
import './assets/iconfont/iconfont.css';
import 'uno.css';
import './styles/global.scss';

const vcWoff2Url = new URL('./assets/iconfont/iconfont.woff2', import.meta.url).href;
const vcWoffUrl = new URL('./assets/iconfont/iconfont.woff', import.meta.url).href;
const vcTtfUrl = new URL('./assets/iconfont/iconfont.ttf', import.meta.url).href;
import { ElButton } from 'element-plus/es/components/button/index';
import elementPlusBaseCss from 'element-plus/theme-chalk/base.css?inline';
import elementPlusButtonCss from 'element-plus/theme-chalk/el-button.css?inline';
import elementPlusMessageCss from 'element-plus/theme-chalk/el-message.css?inline';

type VueRuntimeProps = Partial<MicroAppRuntimeProps>;

function normalizeBase(base: string) {
  const normalized = base.replace(/\/$/, '');
  return normalized === '' ? '/' : normalized;
}

let elementPlusStyleEl: HTMLStyleElement | null = null;
let vcFontStyleEl: HTMLStyleElement | null = null;
let app: ReturnType<typeof createApp> | null = null;
let mountRoot: HTMLElement | null = null;

function injectGlobalStyle(id: string, css: string) {
  let styleEl = document.head.querySelector<HTMLStyleElement>(`style[data-mfe-style="${id}"]`);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-mfe-style', id);
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }
  return styleEl;
}

function render(props: VueRuntimeProps = {}) {
  const container = props.container ?? document.getElementById('app');
  if (!container) return;

  mountRoot = document.createElement('div');
  mountRoot.className = MFE_VUE_CHILD_CLASS;
  container.replaceChildren(mountRoot);

  vcFontStyleEl = injectGlobalStyle(
    'vc-iconfont',
    `@font-face {
  font-family: "vc-iconfont";
  src: url('${vcWoff2Url}') format('woff2'),
       url('${vcWoffUrl}') format('woff'),
       url('${vcTtfUrl}') format('truetype');
}`,
  );

  elementPlusStyleEl = injectGlobalStyle(
    'vue-child-element-plus',
    `${elementPlusBaseCss}\n${elementPlusButtonCss}\n${elementPlusMessageCss}`,
  );

  app = createApp(App);
  app.use(createPinia());
  app.use(
    createAppRouter(
      qiankunWindow.__POWERED_BY_QIANKUN__
        ? props.basename || '/vue'
        : normalizeBase(import.meta.env.BASE_URL),
    ),
  );
  app.provide('mfeMountContainer', mountRoot);
  app.use(ElButton);
  app.mount(mountRoot);
}

renderWithQiankun({
  bootstrap() {},
  mount(props: VueRuntimeProps) {
    render(props);
  },
  unmount() {
    app?.unmount();
    app = null;
    mountRoot?.remove();
    mountRoot = null;
    vcFontStyleEl?.remove();
    vcFontStyleEl = null;
    elementPlusStyleEl?.remove();
    elementPlusStyleEl = null;
  },
  update() {},
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render({ basename: normalizeBase(import.meta.env.BASE_URL) });
}
