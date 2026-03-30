export function VueRoute() {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Vue 子应用区域</h3>
      <p style={{ marginBottom: 0, opacity: 0.85 }}>
        子应用内容将挂载到下方容器。你也可以直接在子应用中使用自己的路由（这里使用 hash 路由）。
      </p>
    </div>
  );
}

