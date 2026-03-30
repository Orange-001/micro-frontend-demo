import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, message } from 'antd';
import { Routes, Route } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { Home } from './pages/Home';
import { VueRoute } from './pages/VueRoute';
import { ReactRoute } from './pages/ReactRoute';
import { RootState } from './store';
import { increment } from './store/counterSlice';
import { startQiankun } from './micro-apps';

export function App() {
  const dispatch = useDispatch();
  const value = useSelector((s: RootState) => s.counter.value);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    startQiankun();
  }, []);

  return (
    <>
      {contextHolder}
      <div className="p-4" style={{ maxWidth: 1100, margin: '24px auto', padding: 16 }}>
        <TopNav />
        <div style={{ height: 16 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Host Redux 示例</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 18 }}>count: {value}</div>
              <Button
                type="primary"
                onClick={() => {
                  dispatch(increment());
                  messageApi.open({
                    type: 'success',
                    content: 'host: 调用了 antd message'
                  });
                }}
              >
                +1
              </Button>
              <i className="iconfont icon-placeholder" aria-hidden="true" style={{ fontSize: 18 }} />
            </div>
          </div>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vue" element={<VueRoute />} />
            <Route path="/react" element={<ReactRoute />} />
          </Routes>

          <div
            id="micro-viewport"
            style={{
              minHeight: 420,
              padding: 0,
              overflow: 'hidden',
              background: 'transparent',
              border: 'none',
              borderRadius: 0
            }}
          >
            <div style={{ padding: 16, opacity: 0.7 }}>子应用区域：等待 qiankun 挂载</div>
          </div>
        </div>
      </div>
    </>
  );
}

