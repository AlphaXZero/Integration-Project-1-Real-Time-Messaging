import { useNavigate } from "react-router";
import { logout } from "../api/auth";

function ChatPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-4xl font-bold text-gold">Messagerie</h1>
      <p className="text-mist">Tu es connecté. La messagerie arrive bientôt.</p>
      <button
        onClick={handleLogout}
        className="cursor-pointer rounded-md border border-night-border px-4 py-2 text-sm font-semibold text-ink transition hover:bg-night-card"
      >
        Se déconnecter
      </button>
    </div>
  );
}

export default ChatPage;