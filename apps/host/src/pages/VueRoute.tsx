import { Wrapper } from './VueRoute.styles';

export function VueRoute() {
  return (
    <Wrapper>
      <h3 className="title">Vue 子应用区域</h3>
      <p className="text">子应用基于 host 下发的 basename 运行，组件库弹层挂载到子应用容器。</p>
    </Wrapper>
  );
}
