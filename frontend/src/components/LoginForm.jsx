import { useState } from "react";
import { register } from "../api/auth";
import { login } from "../api/auth";
import { Link, useNavigate } from "react-router";


const inputClass =
  "rounded-md border border-night-border bg-night-bg px-3 py-2.5 text-ink placeholder:text-mist/60 focus:border-forest focus:outline-none";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Remplis tous les champs.");
      return;
    }

    login(username, password)
      .then(() => navigate("/chat"))
      .catch((err) => {
        if (err instanceof TypeError) {
          setError("Impossible de joindre le serveur.");
        } else {
          setError("Nom d'utilisateur ou mot de passe incorrect.");
        }
      });
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-night-border bg-night-card p-8">
      <h1 className="mb-6 text-center text-4xl font-bold text-gold">
        Connexion
      </h1>
      {success ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-lg font-semibold text-ink">Connexion réussie</p>
          <p className="text-sm text-mist">Bienvenue {username} !</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-sm font-semibold text-ink"
            >
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nom d'utilisateur"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-ink"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="mt-2 cursor-pointer rounded-md bg-forest py-3 font-semibold text-white transition hover:bg-forest-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Se connecter
          </button>
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
        </form>
      )}

      <div className="mt-8 border-t border-night-border pt-6 text-center text-sm text-mist">
        Pas encore de compte ?{" "}
        <Link to="/register" className="font-medium text-gold hover:underline">
          Inscrivez-vous ici
        </Link>
      </div>
    </div>
  );
}

export default LoginForm;
