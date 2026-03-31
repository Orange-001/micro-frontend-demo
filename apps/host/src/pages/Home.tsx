import { Wrapper } from './Home.styles';

export function Home() {
  return (
    <Wrapper>
      <h2 className="title">欢迎</h2>
      <p className="text">通过路由切换，qiankun 会自动加载对应子应用到右侧容器。</p>
    </Wrapper>
  );
}
