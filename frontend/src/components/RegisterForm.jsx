import { useState } from "react";
import { register } from "../api/auth";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setConfirmError(null);

    if (password !== confirmPassword) {
      setConfirmError("Les mots de passe ne correspondent pas");
      return;
    }

    register(username, password)
      .then((data) => console.log("Registered:", data))
      .catch((err) => setError(err));
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-night-border bg-night-card p-8">
        <h1 className="mb-6 text-center text-4xl font-bold text-gold">
          Créez votre compte
        </h1>

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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nom d'utilisateur"
              className="rounded-md border border-night-border bg-night-bg px-3 py-2.5 text-ink placeholder:text-mist/60 focus:border-forest focus:outline-none"
            />
            <p className="text-xs text-mist">
              Doit comporter entre 3 et 15 caractères (lettres et chiffres
              uniquement)
            </p>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="rounded-md border border-night-border bg-night-bg px-3 py-2.5 text-ink placeholder:text-mist/60 focus:border-forest focus:outline-none"
            />
            <p className="text-xs text-mist">
              Doit comporter au moins 8 caractères
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-semibold text-ink"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="rounded-md border border-night-border bg-night-bg px-3 py-2.5 text-ink placeholder:text-mist/60 focus:border-forest focus:outline-none"
            />
            {confirmError && (
              <p className="text-xs text-red-400">{confirmError}</p>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 cursor-pointer rounded-md bg-forest py-3 font-semibold text-white transition hover:bg-forest-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Créer mon compte
          </button>
          {error && (
            <p className="text-sm text-red-400">{JSON.stringify(error)}</p>
          )}
        </form>
        <div className="mt-8 border-t border-night-border pt-6 text-center text-sm text-mist">
          Vous avez déjà un compte ?{" "}
          <a href="#" className="font-medium text-gold hover:underline">
            Connectez-vous ici
          </a>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
