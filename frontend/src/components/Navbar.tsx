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
    <nav className="navbar" role="navigation" aria-label="Hauptnavigation">
      <div className="navbar__inner">
        <NavLink to="/wardrobe" className="navbar__brand" aria-label="Startseite">
          Red Carpet Wardrobe
        </NavLink>

        {isAuthenticated && (
          <div className="navbar__links">
            <NavLink
              to="/wardrobe"
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
              aria-label="Garderobe"
            >
              Garderobe
            </NavLink>
            <NavLink
              to="/outfits/create"
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
              aria-label="Outfit-Creator"
            >
              Outfit-Creator
            </NavLink>
            <NavLink
              to="/outfits"
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
              aria-label="Outfits"
            >
              Outfits
            </NavLink>
            <button
              type="button"
              className="navbar__logout"
              onClick={handleLogout}
              aria-label="Abmelden"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
