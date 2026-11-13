import { Link, NavLink, useNavigate } from 'react-router-dom';
import logo from '../../assets/branding/logo.svg'
import { clearSession, useCurrentUser } from '../../scripts/currentUser';
import './Header.css'

function Header() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <header className="header bg-stridex-black">
      <div className="container d-flex align-items-center py-1">
        
        <nav className="nav justify-content-between align-items-center w-100 gap-4">
          <Link to="/">
            <img src={logo} alt="StrideX" className="header-logo py-2" />
          </Link>
          
          <div className="nav-links d-flex align-items-center gap-4">
            <NavLink to="/" end className="nav-link px-0">Home</NavLink>
            <NavLink to="/training" className="nav-link px-0">Training</NavLink>
            <NavLink to="/groups" className="nav-link px-0">Groups</NavLink>
            <NavLink to="/upload" className="nav-link px-0">Upload</NavLink>
          </div>

          {user == null ? (
            <div className="nav-auth d-flex align-items-center gap-4">
              <NavLink to="/login" className="nav-link px-0">Login</NavLink>
              <NavLink to="/register" className="nav-btn btn rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-1 px-2 my-1 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex">Sign up</NavLink>
            </div>
          ) : (
            <div className="nav-auth d-flex align-items-center gap-4">
              <span className="text-white small">{user.name}</span>
              <button type="button" onClick={logout} className="nav-btn btn rounded-pill border-0 d-inline-flex align-items-center justify-content-center text-white p-1 px-2 my-1 transition-ui hover-bg-stridex-darkgreen-hover focus-stridex">Log out</button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;