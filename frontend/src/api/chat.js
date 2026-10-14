import { WS_URL } from "./config";
import { authFetch } from "./https";

export function getConversations() {
  return authFetch("/conversations/");
}

export function getMessages(conversationId) {
  return authFetch(`/conversations/${conversationId}/messages/`);
}

export function sendMessage(conversationId, content) {
  return authFetch(`/conversations/${conversationId}/messages/`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function createConversation(usernames) {
  return authFetch("/conversations/", {
    method: "POST",
    body: JSON.stringify({ participant_usernames: usernames }),
  });
}

export function addParticipant(conversationId, username) {
  return authFetch(`/conversations/${conversationId}/participants/`, {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export function connectChat(onMessage) {
  const ws = new WebSocket(`${WS_URL}?token=${localStorage.getItem("access")}`);

  ws.onmessage = (event) => {
    onMessage(JSON.parse(event.data));
  };

  return ws;
}