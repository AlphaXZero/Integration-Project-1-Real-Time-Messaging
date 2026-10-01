import { Link } from "react-router";

const linkClass =
  "text-xs font-bold uppercase tracking-wide text-mist transition hover:text-ink";

function Navbar() {
  return (
    <header className="border-b border-night-border bg-night-bg/80 backdrop-blur">
      <nav className="mx-auto flex h-12 max-w-5xl items-center justify-end gap-6 px-4">
        <Link to="/login" className={linkClass}>
          Connexion
        </Link>
        <Link
          to="/register"
          className={`${linkClass} text-gold hover:text-gold/80`}
        >
          Inscription
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
