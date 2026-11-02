# Canopée — Real-Time Messaging (B2B)

Canopée is a real-time web chat for teams, in the spirit of Slack or Teams. Users create an account, talk in private (1:1) or group conversations, and receive messages and notifications instantly, without reloading the page.

School project (Integration Project 1, Ifosup Wavre, 2026-2027) by a team of 2:

| Member | Role |
|---|---|
| Valentin Coisne | Frontend, VPS and deployment |
| Georgé van der Veen | Backend, real time, documentation |

- **Production:** https://canopee.coisnevalentin.be
- **Report:** [`docs/report/rapport.pdf`](docs/report/rapport.pdf)

## Features

- Registration, login and logout with JWT (the session is renewed automatically for 3 days)
- Private conversations (no duplicates: starting a conversation with the same person reopens it)
- Group conversations: optional name, renaming, member list, adding a participant (adding someone to a private conversation creates a new group)
- Real-time messages, new conversations and group changes through WebSockets, with automatic reconnection
- Notifications: toast with sound and an unread dot on the conversation list
- Account deletion (the account is deactivated, its messages stay visible to the others)
- Landing page, pricing page and team page
- Responsive interface (desktop and mobile)

## Tech stack

| Component | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS |
| Backend | Python 3.13, Django 6, Django REST Framework |
| Authentication | JWT (`djangorestframework-simplejwt`): 30 min access token, 3 day refresh token |
| Real time | Django Channels (WebSockets) served by Daphne (ASGI), in-memory channel layer |
| Database | SQLite (backed up before every deployment) |
| Hosting | Debian VPS, Nginx (HTTPS with Let's Encrypt), systemd |
| CI/CD | GitHub Actions |

Why SQLite and an in-memory channel layer instead of PostgreSQL and Redis: the backend runs as a single Daphne process for a few dozen users, so there are no concurrent writers and no other process to reach. Switching to PostgreSQL or Redis only means changing `DATABASES` or `CHANNEL_LAYERS` in `backend/config/settings.py`. The full reasoning is in the report.

## Project structure

    .
    ├── backend/            Django project
    │   ├── accounts/       registration, account deletion
    │   ├── chat/           conversations, messages, WebSocket consumer
    │   └── config/         settings, URLs, ASGI entry point
    ├── frontend/           React application (Vite)
    ├── deploy/             Nginx site, systemd service, deployment script
    ├── docs/               specifications, class diagram, devlog, todo list, report
    └── .github/workflows/  CI (pull requests) and CD (push on main)

## Running the project locally

Requirements: [uv](https://docs.astral.sh/uv/) (it installs Python 3.13 if needed) and Node.js 22.

**Backend** (http://localhost:8000)

    cd backend
    uv sync
    uv run manage.py migrate
    uv run manage.py createsuperuser   # optional, for the admin at /admin/
    uv run manage.py runserver

`daphne` is in `INSTALLED_APPS`, so `runserver` also serves the WebSockets. Without a `.env` file, the backend runs in development mode (`DEBUG=True`, development secret key, CORS open to `http://localhost:5173`).

**Frontend** (http://localhost:5173), in a second terminal

    cd frontend
    npm ci
    npm run dev

In development, the frontend calls the API on `http://localhost:8000/api` and the WebSocket on `ws://localhost:8000/ws/chat/`. To try the real time, open the site in two browsers (or a private window) with two different accounts.

**Checks** (the same ones as the CI)

    cd backend && uv run manage.py test
    cd frontend && npm run lint && npm run build

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/register/` | Create an account |
| POST | `/api/token/` | Log in (returns an access and a refresh token) |
| POST | `/api/token/refresh/` | Get a new access token |
| DELETE | `/api/me/` | Delete my account (password required) |
| GET, POST | `/api/conversations/` | List my conversations, start a private or group conversation |
| PATCH | `/api/conversations/<id>/` | Rename a group |
| GET, POST | `/api/conversations/<id>/messages/` | Read the history, send a message |
| POST | `/api/conversations/<id>/participants/` | Add someone (to a private conversation: creates a new group) |
| WS | `/ws/chat/?token=<access>` | Real-time events: `{"type": "message" or "conversation", "data": {...}}` |

Every endpoint except registration and login requires `Authorization: Bearer <access>`. A conversation the user is not part of returns 404.

## Deployment

- **CI** (`.github/workflows/ci.yml`), on every pull request to `develop` or `main`: backend tests, frontend lint and build.
- **CD** (`.github/workflows/cd.yml`), on every push to `main`: the same checks, then an SSH connection to the VPS that runs [`deploy/deploy.sh`](deploy/deploy.sh): SQLite backup, `git checkout main`, `uv sync`, migrations, static files, frontend build, service restart and HTTP check.
- Production configuration is read from `backend/.env` (see [`backend/.env.example`](backend/.env.example)). The SSH key and server address are GitHub secrets. No secret is committed.
- Backend logs on the server: `journalctl -u canopee`.

## Git workflow

`main` is production and `develop` is the integration branch. Each feature has its own `feature/<name>` branch, merged into `develop` through a reviewed pull request; `develop` is merged into `main` for a release. Commit messages follow `type: description` (`feat`, `fix`, `docs`, `chore`).

## Documentation

- [`docs/ProjectSpecifications.md`](docs/ProjectSpecifications.md): specifications (actors, requirements, architecture, status)
- [`docs/ClassDiagram.puml`](docs/ClassDiagram.puml): UML class diagram (PlantUML)
- [`docs/DEVLOG.md`](docs/DEVLOG.md): development journal, with the backend explained step by step
- [`docs/TODO.md`](docs/TODO.md): what is done and what comes next
- [`docs/report/`](docs/report/): final report (Typst source and PDF)
