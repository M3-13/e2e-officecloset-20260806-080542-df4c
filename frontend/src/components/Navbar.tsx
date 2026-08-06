import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <NavLink to="/wardrobe" className="navbar__brand">
          Red Carpet Wardrobe
        </NavLink>

        {isAuthenticated && (
          <div className="navbar__links">
            <NavLink
              to="/wardrobe"
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              Garderobe
            </NavLink>
            <NavLink
              to="/outfits/create"
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              Outfit-Creator
            </NavLink>
            <NavLink
              to="/outfits"
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              Outfits
            </NavLink>
            <button
              type="button"
              className="navbar__logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
