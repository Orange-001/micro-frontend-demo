export function AboutView() {
  return (
    <div className="view">
      <h2>关于</h2>
      <p style={{ opacity: 0.85 }}>
        这是 qiankun 挂载/卸载流程展示页。你可以在容器切换路由，观察子应用是否正确 mount/unmount。
      </p>
    </div>
  );
}

