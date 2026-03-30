import { Link, NavLink } from 'react-router-dom';

export function TopNav() {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontWeight: 700 }}>MFE Host</div>
      <div style={{ flex: 1 }} />
      <nav style={{ display: 'flex', gap: 12 }}>
        <NavLink to="/" end style={{ color: '#fff', opacity: 0.85 }}>
          首页
        </NavLink>
        <NavLink to="/vue" style={{ color: '#fff', opacity: 0.85 }}>
          Vue 子应用
        </NavLink>
        <NavLink to="/react" style={{ color: '#fff', opacity: 0.85 }}>
          React 子应用
        </NavLink>
      </nav>
      <Link to="/" aria-label="home" style={{ display: 'none' }}>
        home
      </Link>
    </div>
  );
}

