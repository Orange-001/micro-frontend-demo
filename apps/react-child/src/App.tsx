import { useDispatch, useSelector } from 'react-redux';
import { HashRouter, NavLink, Routes, Route } from 'react-router-dom';
import { Button, message } from 'antd';
import { RootState } from './store';
import { increment } from './store/counterSlice';
import { HomeView } from './views/HomeView';
import { AboutView } from './views/AboutView';

export function App() {
  const dispatch = useDispatch();
  const value = useSelector((s: RootState) => s.counter.value);
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <HashRouter>
        <div className="page p-4">
        <div className="card head">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>React 子应用（Redux + React Router）</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <i className="iconfont icon-placeholder" aria-hidden="true" style={{ fontSize: 18 }} />
              <NavLink to="/" className="link">
                首页
              </NavLink>
              <NavLink to="/about" className="link">
                关于
              </NavLink>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Redux 示例</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 18 }}>count: {value}</div>
            <Button
              type="primary"
              onClick={() => {
                dispatch(increment());
                messageApi.open({
                  type: 'success',
                  content: 'react-child: 调用了 antd message'
                });
              }}
            >
              +1
            </Button>
          </div>
        </div>

        <div className="content">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/about" element={<AboutView />} />
          </Routes>
        </div>
      </div>
      </HashRouter>
    </>
  );
}

