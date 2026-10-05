import { useEffect, useRef, useState } from "react";
import { getCurrentUserId } from "../api/auth";
import { getConversations, getMessages, sendMessage } from "../api/chat";

function formatTime(date) {
  return new Date(date).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

function ChatPage() {
  const currentUserId = getCurrentUserId();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const handleError = (err) => {
    if (err.code === "token_not_valid") {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConversation = (id) => {
    setMessages([]);
    setSelectedId(id);
  };

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

  return (
    <div className="flex h-[calc(100dvh-7rem)] w-full max-w-6xl overflow-hidden rounded-xl border border-night-border bg-night-card">
      <aside
        className={`${selectedId !== null ? "hidden" : "flex"} w-full flex-col border-r border-night-border md:flex md:w-72`}
      >
        <div className="border-b border-night-border px-4 py-3">
          <h1 className="text-lg font-bold text-gold">Conversations</h1>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                onClick={() => selectConversation(conversation.id)}
                className={`w-full cursor-pointer border-l-2 px-4 py-3 text-left transition hover:bg-night-bg ${
                  conversation.id === selectedId ? "border-forest bg-night-bg" : "border-transparent"
                }`}
              >
                <p className="font-semibold text-ink">Conversation {conversation.id}</p>
                <p className="text-xs text-mist">Participants : {conversation.participants.join(", ")}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className={`${selectedId !== null ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}>
        {error && (
          <p className="border-b border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300">{error}</p>
        )}

        {selectedId === null ? (
          <div className="flex flex-1 items-center justify-center text-mist">
            Sélectionne une conversation pour commencer.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-night-border px-4 py-3">
              <button
                onClick={() => setSelectedId(null)}
                aria-label="Retour aux conversations"
                className="cursor-pointer text-mist hover:text-ink md:hidden"
              >
                ←
              </button>
              <h2 className="font-semibold text-ink">Conversation {selectedId}</h2>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <p className="m-auto text-sm text-mist">Aucun message pour l'instant.</p>
              )}

              {messages.map((message) => {
                const isMine = message.author === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex max-w-[75%] flex-col ${isMine ? "self-end items-end" : "self-start items-start"}`}
                  >
                    {!isMine && (
                      <span className="mb-1 text-xs font-semibold text-gold">Utilisateur {message.author}</span>
                    )}
                    <p
                      className={`rounded-2xl px-4 py-2 text-sm ${
                        isMine ? "rounded-br-sm bg-forest text-white" : "rounded-bl-sm bg-night-bg text-ink"
                      }`}
                    >
                      {message.content}
                    </p>
                    <span className="mt-1 text-[11px] text-mist">{formatTime(message.created_at)}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 border-t border-night-border p-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message…"
                aria-label="Message"
                className="min-w-0 flex-1 rounded-md border border-night-border bg-night-bg px-3 py-2.5 text-ink placeholder:text-mist/60 focus:border-forest focus:outline-none"
              />
              <button
                type="submit"
                className="cursor-pointer rounded-md bg-forest px-5 font-semibold text-white transition hover:bg-forest-hover"
              >
                Envoyer
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default ChatPage;