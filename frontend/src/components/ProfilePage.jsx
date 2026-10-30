import { useNavigate } from "react-router";
import { logout, getCurrentUsername, getCurrentUserId } from "../api/auth";
import { useState } from "react";
import { deleteAccount } from "../api/account";

function ProfilePage() {
  const navigate = useNavigate();
  const username = getCurrentUsername();
  const userId = getCurrentUserId();
  const initial = username ? username.charAt(0).toUpperCase() : "?";
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDelete = (e) => {
    e.preventDefault();
    deleteAccount(password)
      .then(() => {
        logout();
        navigate("/", { replace: true });
      })
      .catch((err) => {
        setDeleteError(
          err.password ? "Mot de passe incorrect." : "Une erreur est survenue.",
        );
      });
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-night-border bg-night-card p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-forest text-3xl font-bold text-night-bg">
          {initial}
        </span>
        <h1 className="text-3xl font-bold text-gold">
          {username ?? "Mon compte"}
        </h1>
        <p className="text-sm text-mist">Membre de Canopée</p>
      </div>

      <dl className="mt-8 divide-y divide-night-border rounded-lg border border-night-border">
        <div className="flex justify-between px-4 py-3 text-sm">
          <dt className="text-mist">Nom d'utilisateur</dt>
          <dd className="font-semibold text-ink">{username ?? "—"}</dd>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <dt className="text-mist">Identifiant</dt>
          <dd className="font-semibold text-ink">#{userId}</dd>
        </div>
      </dl>

      {!username && (
        <p className="mt-4 text-center text-xs text-mist">
          Reconnecte-toi pour afficher ton nom d'utilisateur.
        </p>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-8 w-full cursor-pointer rounded-md border border-night-border py-2.5 text-sm font-semibold text-mist transition hover:border-red-400 hover:text-red-400"
      >
        Se déconnecter
      </button>
      {!showDelete ? (
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="mt-4 w-full cursor-pointer rounded-md border border-red-400/60 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-400/10"
        >
          Supprimer mon compte
        </button>
      ) : (
        <form
          onSubmit={handleDelete}
          className="mt-4 flex flex-col gap-2 rounded-lg border border-red-400/40 p-4"
        >
          <p className="text-xs text-mist">
            Ton compte sera désactivé. Tes messages restent visibles par les
            autres membres. Cette action est irréversible.
          </p>
          <input
            type="password"
            placeholder="Ton mot de passe"
            aria-label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-night-border bg-night-bg px-3 py-2 text-sm text-ink focus:border-red-400 focus:outline-none"
          />
          {deleteError && <p className="text-xs text-red-300">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              className="flex-1 cursor-pointer rounded-md border border-night-border py-2 text-sm text-mist hover:text-ink"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 cursor-pointer rounded-md bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Supprimer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProfilePage;
