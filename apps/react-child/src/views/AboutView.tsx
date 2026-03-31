import { Wrapper } from './AboutView.styles';

export function AboutView() {
  return (
    <Wrapper>
      <h2>关于</h2>
      <p className="text">
        这是 qiankun 挂载/卸载流程展示页。你可以在容器切换路由，观察子应用是否正确 mount/unmount。
      </p>
    </Wrapper>
  );
}
