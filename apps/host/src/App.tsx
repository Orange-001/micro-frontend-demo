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
import { Wrapper } from './App.styles';

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
      <Wrapper $highlight={value >= 10}>
        <TopNav />
        <div className="spacer" />

        <div className="grid">
          <div className="card">
            <h3 className="card-title">Host Redux 示例</h3>
            <div className="counter-row">
              <div className="counter-value">count: {value}</div>
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
                className="iconfont icon-placeholder"
                aria-hidden="true"
                style={{ fontSize: 18 }}
              />
            </div>
          </div>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vue" element={<VueRoute />} />
            <Route path="/react" element={<ReactRoute />} />
          </Routes>

          <div className="micro-viewport" id="micro-viewport">
            <div className="placeholder">子应用区域：等待 qiankun 挂载</div>
          </div>
        </div>
      </Wrapper>
    </>
  );
}
