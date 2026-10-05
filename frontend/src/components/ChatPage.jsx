import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { logout } from "../api/auth";
import { getConversations, getMessages, sendMessage } from "../api/chat";

function ChatPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);

  const handleError = (err) => {
    if (err.status === 401) {
      setError("Session expirée, reconnecte-toi.");
    } else {
      setError("Une erreur est survenue.");
    }
  };

  useEffect(() => {
    getConversations()
      .then((data) => setConversations(data))
      .catch(handleError);
  }, []);

  useEffect(() => {
    if (selectedId === null) return;

    getMessages(selectedId)
      .then((data) => setMessages(data))
      .catch(handleError);
  }, [selectedId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage(selectedId, newMessage)
      .then((created) => {
        setMessages([...messages, created]);
        setNewMessage("");
      })
      .catch(handleError);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-full">
      <h1>Messagerie</h1>
      <button onClick={handleLogout}>Se déconnecter</button>

      {error && <p>{error}</p>}

      <h2>Mes conversations</h2>
      <ul>
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button onClick={() => setSelectedId(conversation.id)}>
              Conversation {conversation.id} – participants : {conversation.participants.join(", ")}
            </button>
          </li>
        ))}
      </ul>

      {selectedId !== null && (
        <div>
          <h2>Messages de la conversation {selectedId}</h2>
          {messages.length === 0 ? (
            <p>Aucun message.</p>
          ) : (
            <ul>
              {messages.map((message) => (
                <li key={message.id}>
                  Utilisateur {message.author} : {message.content}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSend}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrire un message"
            />
            <button type="submit">Envoyer</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatPage;