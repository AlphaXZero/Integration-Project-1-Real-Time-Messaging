import { WS_URL } from "./config";
import { authFetch, expireSession, refreshAccess } from "./https";

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

export function connectChat(onMessage, onReconnect) {
  let ws = null;
  let retries = 0;
  let timer = null;
  let stopped = false;

  const scheduleRetry = () => {
    const delay = Math.min(1000 * 2 ** retries, 30000);
    retries += 1;
    timer = setTimeout(open, delay);
  };

  async function open() {
    if (retries > 0) {
      try {
        const refreshed = await refreshAccess();
        if (!refreshed) {
          expireSession();
          return;
        }
      } catch {
        if (!stopped) scheduleRetry();
        return;
      }
    }
    if (stopped) return;

    ws = new WebSocket(`${WS_URL}?token=${localStorage.getItem("access")}`);

    ws.onopen = () => {
      if (retries > 0) onReconnect?.();
      retries = 0;
    };

    ws.onmessage = (event) => {
      onMessage(JSON.parse(event.data));
    };

    ws.onclose = () => {
      if (!stopped) scheduleRetry();
    };
  }

  open();

  return () => {
    stopped = true;
    clearTimeout(timer);
    ws?.close();
  };
}
