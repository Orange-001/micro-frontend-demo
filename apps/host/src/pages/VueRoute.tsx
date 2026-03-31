import { Wrapper } from './VueRoute.styles';

export function VueRoute() {
  return (
    <Wrapper>
      <h3 className="title">Vue 子应用区域</h3>
      <p className="text">子应用内容将挂载到下方容器。你也可以直接在子应用中使用自己的路由（这里使用 hash 路由）。</p>
    </Wrapper>
  );
}
