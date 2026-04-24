import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, message } from 'antd';
import { Routes, Route } from 'react-router-dom';
import { MICRO_APP_CONTAINER_ID } from '@mfe/shared';
import { TopNav } from './components/TopNav';
import { Home } from './pages/Home';
import { VueRoute } from './pages/VueRoute';
import { ReactRoute } from './pages/ReactRoute';
import { RootState } from './store';
import { increment } from './store/counterSlice';
import { startQiankun, subscribeMicroAppLoading } from './micro-apps';
import { Wrapper } from './App.styles';

export function App() {
  const dispatch = useDispatch();
  const value = useSelector((s: RootState) => s.counter.value);
  const [messageApi, contextHolder] = message.useMessage();
  const [loadingApp, setLoadingApp] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeMicroAppLoading(({ name, loading }) => {
      setLoadingApp(loading ? name : '');
    });
    startQiankun();

    return unsubscribe;
  }, []);

  return (
    <>
      {contextHolder}
      <Wrapper className="mfe-shell" $highlight={value >= 10}>
        <TopNav />
        <div className="mfe-shell__spacer" />

        <main className="mfe-shell__grid">
          <section className="mfe-card mfe-host-card">
            <h3 className="mfe-card__title">Host Redux 示例</h3>
            <div className="mfe-counter-row">
              <div className="mfe-counter-value">count: {value}</div>
              <Button
                type="primary"
                onClick={() => {
                  dispatch(increment());
                  messageApi.open({
                    type: 'success',
                    content: 'host: 调用了 antd message',
                  });
                }}
              >
                +1
              </Button>
              <i
                className="host-iconfont host-icon-cangshu"
                aria-hidden="true"
                style={{ fontSize: 18 }}
              />
            </div>
          </section>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vue/*" element={<VueRoute />} />
            <Route path="/react/*" element={<ReactRoute />} />
          </Routes>

          <section className="mfe-viewport" aria-label="微前端子应用区域">
            {loadingApp && (
              <div className="mfe-viewport__loading" role="status" aria-live="polite">
                <span className="mfe-viewport__spinner" />
                <span>正在加载 {loadingApp} 子应用...</span>
              </div>
            )}
            <div id={MICRO_APP_CONTAINER_ID} className="mfe-viewport__mount" />
          </section>
        </main>
      </Wrapper>
    </>
  );
}
