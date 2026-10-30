import { Link } from "react-router";
import { isLoggedIn } from "../api/auth";

const highlights = [
  { title: "Temps réel", text: "Vos messages arrivent instantanément." },
  { title: "Pensé pour les équipes", text: "Une conversation par projet, par client ou par équipe." },
  { title: "Sécurisé", text: "Connexion protégée et données hébergées en Europe." },
];

function HomePage() {
  const loggedIn = isLoggedIn();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-12 text-center">
      <div className="flex flex-col items-center gap-6">
        <span className="rounded-full border border-night-border bg-night-card px-3 py-1 text-xs font-semibold text-forest">
          Messagerie en temps réel
        </span>

        <h1 className="text-4xl font-bold leading-tight text-ink md:text-5xl">
          Toute votre équipe, <span className="text-gold">sous la même canopée.</span>
        </h1>

        <p className="max-w-2xl text-lg text-mist">
          Canopée réunit vos conversations professionnelles dans un espace simple, rapide et sécurisé.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {loggedIn ? (
            <Link
              to="/chat"
              className="rounded-md bg-forest px-6 py-3 font-semibold text-white transition hover:bg-forest-hover"
            >
              Ouvrir la messagerie
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-md bg-forest px-6 py-3 font-semibold text-white transition hover:bg-forest-hover"
              >
                Créer un compte
              </Link>
              <Link
                to="/login"
                className="rounded-md border border-night-border px-6 py-3 font-semibold text-ink transition hover:bg-night-card"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>
      </div>

      <ul className="grid w-full gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <li key={item.title} className="rounded-xl border border-night-border bg-night-card p-6 text-left">
            <h2 className="font-semibold text-ink">{item.title}</h2>
            <p className="mt-2 text-sm text-mist">{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HomePage;