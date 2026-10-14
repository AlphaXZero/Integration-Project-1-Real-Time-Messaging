import { API_URL } from "./config";
import { logout } from "./auth";

async function refreshAccess() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;
  const res = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return false;
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
  if (res.status === 401) logout();
  if (!res.ok) throw await res.json();
  return res.json();
}