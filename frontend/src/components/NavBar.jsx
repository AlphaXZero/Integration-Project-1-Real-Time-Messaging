import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { isLoggedIn, logout, getCurrentUsername } from "../api/auth";

const navLinks = [{ to: "/equipe", label: "Notre équipe" }, { to: "/tarifs", label: "Tarifs" }];

const linkClass =
  "text-xs font-bold uppercase tracking-wide text-mist transition hover:text-ink";

const menuItemClass =
  "block w-full px-4 py-2.5 text-left text-sm text-mist transition hover:bg-night-bg hover:text-ink";

function UserMenu({ username, onLogout, onNavigate }) {
  const initial = username ? username.charAt(0).toUpperCase() : "?";


  const closeDropdown = () => document.activeElement?.blur();
  const handleNavigate = () => {
    closeDropdown();
    onNavigate();
  };
  const handleLogout = () => {
    closeDropdown();
    onLogout();
  };

  return (

    <div className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink transition hover:text-gold"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-bold text-night-bg">
          {initial}
        </span>
        <span className="max-w-32 truncate">{username ?? "Mon compte"}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition group-hover:rotate-180 group-focus-within:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className="invisible absolute right-0 top-full pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="w-48 overflow-hidden rounded-lg border border-night-border bg-night-card shadow-lg shadow-black/40">
          <p className="border-b border-night-border px-4 py-3 text-xs text-mist">
            Connecté en tant que
            <span className="block truncate text-sm font-semibold text-ink">
              {username ?? "—"}
            </span>
          </p>
          <Link to="/profil" onClick={handleNavigate} className={menuItemClass}>
            Mon profil
          </Link>
          <Link to="/chat" onClick={handleNavigate} className={menuItemClass}>
            Mes conversations
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`cursor-pointer border-t border-night-border ${menuItemClass} hover:text-red-400`}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useLocation();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const username = getCurrentUsername();

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

          <Link to="/" onClick={closeMenu} className="text-lg font-bold text-gold">
            Canopée
          </Link>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {loggedIn ? (
            <>
              <UserMenu
                username={username}
                onLogout={handleLogout}
                onNavigate={closeMenu}
              />
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