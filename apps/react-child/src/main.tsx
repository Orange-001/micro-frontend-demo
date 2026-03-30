import { createRoot, type Root } from 'react-dom/client';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';
import { Provider } from 'react-redux';
import { store } from './store';
import { App } from './App';
import '@mfe/shared/iconfont.css';
import 'uno.css';
import { AntProvider } from './AntProvider';
import './styles/global.scss';

let root: Root | null = null;

function render(props: any) {
  const container: HTMLElement = props?.container ?? document.getElementById('root')!;
  container.innerHTML = '';
  container.innerHTML = '<div style="padding:16px;opacity:.8">[react-child] mount() called...</div>';
  root = createRoot(container);
  root.render(
    <Provider store={store}>
      <AntProvider hashId="react-child-antd" microContainer={container}>
        <App />
      </AntProvider>
    </Provider>
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
  }
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render({});
}

