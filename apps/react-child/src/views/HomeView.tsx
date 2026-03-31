import { Wrapper } from './HomeView.styles';

export function HomeView() {
  return (
    <Wrapper>
      <h2>首页</h2>
      <p className="text">
        这是 React 子应用。为了减少与容器前缀冲突，这里使用 <code>HashRouter</code>。
      </p>
    </Wrapper>
  );
}
