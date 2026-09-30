import { useState } from "react";
import { register } from "../api/auth";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setConfirmError(null);

    if (username.length < 3) {
      setErrors({ username: ["Trop court : 3 caractères minimum"] });
      return;
    }
    if (username.length > 15) {
      setErrors({ username: ["Trop long : 15 caractères maximum"] });
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setErrors({ username: ["Seuls les lettres et les chiffres sont autorisés"] });
      return;
    }
    if (password.length < 8) {
      setErrors({ password: ["Trop court : 8 caractères minimum"] });
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError("Les mots de passe ne correspondent pas");
      return;
    }

    register(username, password)
      .then(() => setSuccess(true))
      .catch((err) => {
        if (err instanceof TypeError) {
          setErrors({ global: "Impossible de joindre le serveur." });
        } else {
          setErrors(err);
        }
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-night-border bg-night-card p-8">
        <h1 className="mb-6 text-center text-4xl font-bold text-gold">
          Créez votre compte
        </h1>
        {success ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-lg font-semibold text-ink">Compte créé</p>
            <p className="text-sm text-mist">
              Bienvenue {username}, tu peux maintenant te connecter.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-semibold text-ink">
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
              <p className={`text-xs ${errors.username ? "text-red-400" : "text-mist"}`}>
                {errors.username
                  ? errors.username[0]
                  : "Doit comporter entre 3 et 15 caractères (lettres et chiffres uniquement)"}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-ink">
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
              <p className={`text-xs ${errors.password ? "text-red-400" : "text-mist"}`}>
                {errors.password ? errors.password[0] : "Doit comporter au moins 8 caractères"}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-ink">
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
              {confirmError && <p className="text-xs text-red-400">{confirmError}</p>}
            </div>

            <button
              type="submit"
              className="mt-2 cursor-pointer rounded-md bg-forest py-3 font-semibold text-white transition hover:bg-forest-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Créer mon compte
            </button>
            {errors.global && (
              <p className="text-center text-sm text-red-400">{errors.global}</p>
            )}
          </form>
        )}

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