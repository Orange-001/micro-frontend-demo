import { Wrapper } from './HomeView.styles';

export function HomeView() {
  return (
    <Wrapper>
      <h2>首页</h2>
      <p className="text">
        这是 React 子应用。基于 host 下发的 basename 运行，支持更清晰的深链路径。
      </p>
    </Wrapper>
  );
}
