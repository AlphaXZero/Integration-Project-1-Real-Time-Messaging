const isDev = import.meta.env.DEV;

const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";

export const API_URL = isDev ? "http://localhost:8000/api" : "/api";

export const WS_URL = isDev
  ? "ws://localhost:8000/ws/chat/"
  : `${wsProtocol}//${window.location.host}/ws/chat/`;