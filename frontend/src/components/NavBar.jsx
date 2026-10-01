const linkClass =
  "text-xs font-bold uppercase tracking-wide text-mist transition hover:text-ink";

function Navbar() {
  return (
    <header className="border-b border-night-border bg-night-bg/80 backdrop-blur">
      <nav className="mx-auto flex h-12 max-w-5xl items-center justify-end gap-6 px-4">
        <a href="#" className={linkClass}>Connexion</a>
        <a href="#" className={`${linkClass} text-gold hover:text-gold/80`}>Inscription</a>
      </nav>
    </header>
  );
}

export default Navbar;