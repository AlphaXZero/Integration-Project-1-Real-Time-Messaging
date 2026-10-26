import { API_URL } from "./config";
import { logout } from "./auth";

export async function refreshAccess() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;
  const res = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (res.status === 400 || res.status === 401) return false;
  if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
  localStorage.setItem("access", (await res.json()).access);
  return true;
}

export async function authFetch(path, options = {}, retry = true) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  });
  if (res.status === 401 && retry && (await refreshAccess())) {
    return authFetch(path, options, false);
  }
  if (res.status === 401) expireSession();
  if (!res.ok) throw await res.json();
  return res.json();
}

export function expireSession() {
  logout();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }}