import { Link, NavLink } from 'react-router-dom';
import logo from '../../assets/branding/logo.svg'
import './Header.css'

function Header() {
  return (
    <header className="header d-flex align-items-center justify-content-start bg-stridex-black px-3 py-1">
      <Link to="/">
        <img src={logo} alt="StrideX" className="header-logo py-2" />
      </Link>
      <nav className="nav gap-3 ms-3">
        <NavLink to="/" end className="nav-link px-0">Home</NavLink>
        <NavLink to="/training" className="nav-link px-0">Training</NavLink>
        <NavLink to="/groups" className="nav-link px-0">Groups</NavLink>
      </nav>
    </header>
  );
}

export default Header;