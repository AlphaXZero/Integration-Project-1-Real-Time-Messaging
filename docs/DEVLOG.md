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

## Apps
Went straight for DRF from the start this time (no HTML templates/views for auth — API-only, since the frontend is React from day one).
```bash
uv run manage.py startapp accounts
uv run manage.py startapp chat
```

Both apps, plus `rest_framework`, must be declared in `INSTALLED_APPS` (`config/settings.py`) — creating an app folder isn't enough on its own.


## Decisions carried over from the exploration phase
(to be implemented, not yet done in the clean project)
- SQLite in development, PostgreSQL only at deployment time.
- `.env` for secrets from the start (`SECRET_KEY`, etc.).
- API-only backend — no HTML auth views, everything through DRF for React to consume.