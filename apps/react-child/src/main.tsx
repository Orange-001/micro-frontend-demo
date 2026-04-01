import { createRoot, type Root } from 'react-dom/client';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import { Provider } from 'react-redux';
import { store } from './store';
import { App } from './App';
import '@mfe/shared/iconfont.css';
import './assets/iconfont/iconfont.css';
import 'uno.css';
import { AntProvider } from './AntProvider';
import './styles/global.scss';

const rcWoff2Url = new URL('./assets/iconfont/iconfont.woff2', import.meta.url).href;
const rcWoffUrl = new URL('./assets/iconfont/iconfont.woff', import.meta.url).href;
const rcTtfUrl = new URL('./assets/iconfont/iconfont.ttf', import.meta.url).href;

let root: Root | null = null;
let rcFontStyleEl: HTMLStyleElement | null = null;

function render(props: any) {
  const container: HTMLElement = props?.container ?? document.getElementById('root')!;
  container.innerHTML = '';
  container.innerHTML =
    '<div style="padding:16px;opacity:.8">[react-child] mount() called...</div>';

  // qiankun experimentalStyleIsolation 会 scope @font-face 导致字体加载失败；
  // 用 new URL + import.meta.url 获取绝对路径，手动注入全局 @font-face。
  if (!rcFontStyleEl) {
    rcFontStyleEl = document.createElement('style');
    rcFontStyleEl.setAttribute('data-mfe-style', 'rc-iconfont');
    rcFontStyleEl.textContent = `
@font-face {
  font-family: "rc-iconfont";
  src: url('${rcWoff2Url}') format('woff2'),
       url('${rcWoffUrl}') format('woff'),
       url('${rcTtfUrl}') format('truetype');
}`;
    document.head.appendChild(rcFontStyleEl);
  }
  root = createRoot(container);
  root.render(
    <Provider store={store}>
      <AntProvider microContainer={container}>
        <App />
      </AntProvider>
    </Provider>,
  );
}

renderWithQiankun({
  bootstrap() {
    // qiankun 在 BOOTSTRAPPING 阶段会调用，必须存在
  },
  mount(props: any) {
    render(props);
  },
  unmount() {
    root?.unmount();
    root = null;
    if (rcFontStyleEl?.parentNode) {
      rcFontStyleEl.parentNode.removeChild(rcFontStyleEl);
    }
    rcFontStyleEl = null;
  },
  update() {},
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render({});
}
