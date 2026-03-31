import { Link, NavLink } from 'react-router-dom';
import { Wrapper } from './TopNav.styles';

export function TopNav() {
  return (
    <Wrapper>
      <div className="brand">MFE Host</div>
      <div style={{ flex: 1 }} />
      <nav className="nav-links">
        <NavLink className="nav-link" to="/" end>
          首页
        </NavLink>
        <NavLink className="nav-link" to="/vue">
          Vue 子应用
        </NavLink>
        <NavLink className="nav-link" to="/react">
          React 子应用
        </NavLink>
      </nav>
      <Link to="/" aria-label="home" style={{ display: 'none' }}>
        home
      </Link>
    </Wrapper>
  );
}
