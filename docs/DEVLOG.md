# Development Log

## Project restructuring
Restarted the project from scratch with a cleaner architecture, after a first exploratory pass that mixed everything in one folder.

**Structure decided:**

```
.
├── backend/
├── frontend/
└── docs/
```

Single monorepo (not separate repos for backend/frontend) — matches the spec's suggested layout, and simpler for a 2-person team where both parts deploy together.

## Git workflow
Decided on a simplified Git Flow for the team:
- `main` — stable, deployable only.
- `develop` — integration branch for finished features.
- `feature/*` — one branch per feature, merged into `develop` via PR.
- Commit convention: `type: short description` (`feat`, `fix`, `chore`, `docs`).

## Documentation setup
- `README.md` at the root — project overview, tech stack, getting started.
- `docs/TODO.md` — feature backlog, split into Important / Nice to have.
- `docs/LEARNING.md` (this file) — concepts and gotchas as we learn them.
- `docs/Project_specifications.md` + `docs/class_diagram.puml` — original spec docs.

## Backend init
```bash
cd backend
uv init
uv add django djangorestframework
uv run django-admin startproject config .
```
## Frontend init
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev
```

## backend: first Apps
Went straight for DRF from the start this time (no HTML templates/views for auth — API-only, since the frontend is React from day one).
```bash
uv run manage.py startapp accounts
uv run manage.py startapp chat
```

Both apps, plus `rest_framework`, must be declared in `INSTALLED_APPS` (`config/settings.py`) — creating an app folder isn't enough on its own.

## backend : CORS
React (`localhost:5173`) and Django (`localhost:8000`) are different origins, so the browser blocks JS from reading Django's responses unless Django explicitly allows it.

```bash
cd backend
uv add django-cors-headers
```

In `config/settings.py`:
- Add `"corsheaders"` to `INSTALLED_APPS`.
- Add `"corsheaders.middleware.CorsMiddleware"` at the **top** of `MIDDLEWARE` so it runs before anything else.
- Whitelist the frontend origin:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
```

No `CORS_ALLOW_CREDENTIALS` and no Vite proxy needed: JWT goes in a header, not a cookie.

## backend : JWT authentication
**JWT**: authenticate with a signed token sent in a header, instead of a session cookie.
```bash
uv add djangorestframework-simplejwt
```

Make DRF authenticate requests with JWT by default (`config/settings.py`):
```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}
```

SimpleJWT ships ready-made views, so no login code to write (`config/urls.py`):
```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

(path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),)
(path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),)
```
- `/api/token/`: send `username` + `password`, get back an `access` token (short-lived, sent on every request) and a `refresh` token (long-lived, used to get a new `access`).
- `/api/token/refresh/`: send the `refresh` token, get a new `access` token without asking for the password again.

## bakcend : Testing the token endpoint
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "...", "password": "..."}'
```
- Valid credentials: JSON with `refresh` and `access`.
- Wrong credentials: `{"detail": "No active account found with the given credentials"}`.

**Gotcha**: the first attempt returned an HTML error page (`OperationalError`). The fresh database had no tables yet, so Django couldn't look up the user. Fix: run `uv run manage.py migrate` on any new database, then `uv run manage.py createsuperuser`.



## Decisions carried over from the exploration phase
(to be implemented, not yet done in the clean project)
- SQLite in development, PostgreSQL only at deployment time.
- `.env` for secrets from the start (`SECRET_KEY`, etc.).
- API-only backend — no HTML auth views, everything through DRF for React to consume.