import { Wrapper } from './ReactRoute.styles';

export function ReactRoute() {
  return (
    <Wrapper>
      <h3 className="title">React 子应用区域</h3>
      <p className="text">子应用内容将挂载到下方容器。为了避免前缀冲突，这里子应用使用 hash 路由。</p>
    </Wrapper>
  );
}
