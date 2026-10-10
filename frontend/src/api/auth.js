import { API_URL } from "./config";

export async function register(username, password) {
  const response = await fetch(`${API_URL}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errors = await response.json();
    throw errors;
  }

  return response.json();
}

export async function login(username, password) {
  const response = await fetch(`${API_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errors = await response.json();
    throw errors;
  }

  const data = await response.json();
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function isLoggedIn() {
  return localStorage.getItem("access") !== null;
}

export function getCurrentUserId() {
  const token = localStorage.getItem("access");
  if (!token) return null;

  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return Number(JSON.parse(atob(payload)).user_id);
}