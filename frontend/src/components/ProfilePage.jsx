import { useNavigate } from "react-router";
import { logout, getCurrentUsername, getCurrentUserId } from "../api/auth";

function ProfilePage() {
  const navigate = useNavigate();
  const username = getCurrentUsername();
  const userId = getCurrentUserId();
  const initial = username ? username.charAt(0).toUpperCase() : "?";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-night-border bg-night-card p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-forest text-3xl font-bold text-night-bg">
          {initial}
        </span>
        <h1 className="text-3xl font-bold text-gold">{username ?? "Mon compte"}</h1>
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
    </div>
  );
}

export default ProfilePage;