# Canopée — frontend

React 19 single-page application built with Vite, React Router and Tailwind CSS.

- `src/components/`: pages (home, pricing, team, login, register, chat, profile) and shared components (navbar, toast, protected routes)
- `src/api/`: API calls with automatic token refresh (`https.js`), WebSocket connection with reconnection (`chat.js`), URLs (`config.js`)

```bash
npm ci
npm run dev     # http://localhost:5173, expects the backend on http://localhost:8000
npm run lint    # oxlint
npm run build   # production build in dist/
```

In production, the build is served by Nginx and the API and WebSocket are reached on the same domain (`/api`, `/ws`). See the [main README](../README.md).
