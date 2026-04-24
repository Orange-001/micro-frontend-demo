import { Wrapper } from './ReactRoute.styles';

export function ReactRoute() {
  return (
    <Wrapper>
      <h3 className="title">React 子应用区域</h3>
      <p className="text">子应用基于 host 下发的 basename 运行，样式限制在自己的根容器内。</p>
    </Wrapper>
  );
}
