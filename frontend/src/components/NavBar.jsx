import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { isLoggedIn, logout } from "../api/auth";

const navLinks = [{ to: "/equipe", label: "Notre équipe" }, { to: "/tarifs", label: "Tarifs" }];


const linkClass =
  "text-xs font-bold uppercase tracking-wide text-mist transition hover:text-ink";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useLocation();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login");
  };


  return (
    <header className="relative z-50 border-b border-night-border bg-night-bg/80 backdrop-blur">
      <nav className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="cursor-pointer text-mist hover:text-ink"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>

          <Link
            to="/"
            onClick={closeMenu}
            className="text-lg font-bold text-gold"
          >
            Canopée
          </Link>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {loggedIn ? (
            <>
              <Link to="/chat" onClick={closeMenu} className={linkClass}>
                Messagerie
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={`cursor-pointer ${linkClass}`}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu} className={linkClass}>
                Connexion
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className={`${linkClass} text-gold hover:text-gold/80`}
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>

      {menuOpen && (
        <div
          id="main-menu"
          className="absolute inset-x-0 top-full border-b border-night-border bg-night-bg"
        >
          <ul className="mx-auto flex max-w-5xl flex-col px-4 py-2">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={closeMenu}
                  className={`block py-3 ${linkClass}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Navbar;
