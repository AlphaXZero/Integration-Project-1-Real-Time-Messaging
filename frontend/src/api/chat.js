const BASE_URL = "http://localhost:8000/api";
const WS_URL = "ws://localhost:8000/ws/chat/";


export async function getConversations() {
  const response = await fetch(`${BASE_URL}/conversations/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}

export async function getMessages(conversationId) {
  const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}

export async function sendMessage(conversationId, content) {
  const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}

export function connectChat(onMessage) {
  const ws = new WebSocket(`${WS_URL}?token=${localStorage.getItem("access")}`);

  ws.onmessage = (event) => {
    onMessage(JSON.parse(event.data));
  };

  return ws;
}
export async function createConversation(usernames) {
  const response = await fetch(`${BASE_URL}/conversations/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
    body: JSON.stringify({ participant_usernames: usernames }),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}