import { useDispatch, useSelector } from 'react-redux';
import { HashRouter, NavLink, Routes, Route } from 'react-router-dom';
import { Button, message } from 'antd';
import { RootState } from './store';
import { increment } from './store/counterSlice';
import { HomeView } from './views/HomeView';
import { AboutView } from './views/AboutView';
import { Wrapper } from './App.styles';

export function App() {
  const dispatch = useDispatch();
  const value = useSelector((s: RootState) => s.counter.value);
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <HashRouter>
        <Wrapper>
          <div className="card head">
            <div className="head-row">
              <div className="brand">React 子应用（Redux + React Router）</div>
              <div className="nav-links">
                <i
                  className="rc-iconfont rc-icon-shengdanmilu"
                  aria-hidden="true"
                  style={{ fontSize: 18 }}
                />
                <NavLink className="nav-link" to="/" end>
                  首页
                </NavLink>
                <NavLink className="nav-link" to="/about">
                  关于
                </NavLink>
              </div>
            </div>
          </div>

          <div className="card counter-card">
            <h3 className="card-title">Redux 示例</h3>
            <div className="counter-row">
              <div className="counter-value">count: {value}</div>
              <Button
                type="primary"
                onClick={() => {
                  dispatch(increment());
                  messageApi.open({
                    type: 'success',
                    content: 'react-child: 调用了 antd message',
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
        </Wrapper>
      </HashRouter>
    </>
  );
}
