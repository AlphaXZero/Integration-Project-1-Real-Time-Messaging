const BASE_URL = "http://localhost:8000/api";

export async function register(username, password) {
  const response = await fetch(`${BASE_URL}/register/`, {
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