import { authFetch } from "./https";

export function deleteAccount(password) {
  return authFetch("/me/", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}