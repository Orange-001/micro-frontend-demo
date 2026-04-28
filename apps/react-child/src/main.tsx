import { createRoot, type Root } from 'react-dom/client';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import { Provider } from 'react-redux';
import { MFE_REACT_CHILD_CLASS, type MicroAppRuntimeProps } from '@mfe/shared';
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

type ReactRuntimeProps = Partial<MicroAppRuntimeProps>;

type CssImportProbeResult = {
  index: number;
  tag: 'style' | 'link';
  attrs: Record<string, string>;
  href?: string;
  textLength?: number;
  containsGlobalScss: boolean;
  containsSharedTokens: boolean;
};

type ReactChildDebugWindow = Window & {
  __inspectReactChildCssImports?: () => CssImportProbeResult[];
};

function normalizeBase(base: string) {
  const normalized = base.replace(/\/$/, '');
  return normalized === '' ? '/' : normalized;
}

let root: Root | null = null;
let rcFontStyleEl: HTMLStyleElement | null = null;
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

function inspectReactChildCssImports() {
  const nodes = Array.from(
    document.head.querySelectorAll<HTMLStyleElement | HTMLLinkElement>(
      'style, link[rel="stylesheet"]',
    ),
  );

  return nodes.map((node, index): CssImportProbeResult => {
    const attrs = Array.from(node.attributes).reduce<Record<string, string>>((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});
    const text = node.tagName.toLowerCase() === 'style' ? node.textContent || '' : '';

    return {
      index,
      tag: node.tagName.toLowerCase() as 'style' | 'link',
      attrs,
      href: node instanceof HTMLLinkElement ? node.href : undefined,
      textLength: text.length || undefined,
      containsGlobalScss: text.includes('.mfe-app-react-child'),
      containsSharedTokens:
        text.includes('--mfe-font-family') || text.includes('--mfe-color-react-primary'),
    };
  });
}

(window as ReactChildDebugWindow).__inspectReactChildCssImports = inspectReactChildCssImports;

function render(props: ReactRuntimeProps = {}) {
  const container = props.container ?? document.getElementById('root');
  if (!container) return;

  mountRoot = document.createElement('div');
  mountRoot.className = MFE_REACT_CHILD_CLASS;
  container.replaceChildren(mountRoot);

  rcFontStyleEl = injectGlobalStyle(
    'rc-iconfont',
    `@font-face {
  font-family: "rc-iconfont";
  src: url('${rcWoff2Url}') format('woff2'),
       url('${rcWoffUrl}') format('woff'),
       url('${rcTtfUrl}') format('truetype');
}`,
  );

  root = createRoot(mountRoot);
  root.render(
    <Provider store={store}>
      <AntProvider microContainer={mountRoot}>
        <App
          basename={
            qiankunWindow.__POWERED_BY_QIANKUN__
              ? props.basename || '/react'
              : normalizeBase(import.meta.env.BASE_URL)
          }
        />
      </AntProvider>
    </Provider>,
  );
}

renderWithQiankun({
  bootstrap() {},
  mount(props: ReactRuntimeProps) {
    render(props);
  },
  unmount() {
    root?.unmount();
    root = null;
    mountRoot?.remove();
    mountRoot = null;
    rcFontStyleEl?.remove();
    rcFontStyleEl = null;
  },
  update() {},
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render({ basename: normalizeBase(import.meta.env.BASE_URL) });
}

if (new URLSearchParams(window.location.search).has('mfeCssDebug')) {
  window.setTimeout(() => {
    console.table(inspectReactChildCssImports());
  });
}
