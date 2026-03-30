export function ReactRoute() {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>React 子应用区域</h3>
      <p style={{ marginBottom: 0, opacity: 0.85 }}>
        子应用内容将挂载到下方容器。为了避免前缀冲突，这里子应用使用 hash 路由。
      </p>
    </div>
  );
}

