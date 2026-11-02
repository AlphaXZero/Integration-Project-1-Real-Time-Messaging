# Project Specifications

**Real-Time Messaging Application (B2B)**
Integration Project 1 — Team of 2 — Version 3.0 (November 2026)

Version 2.0 (September 2026) replaced version 1.0 with the architecture actually chosen (React + Django REST + JWT). Version 3.0 updates the status of every section at delivery time (02/11/2026). The final report (`docs/report/rapport.pdf`) explains the choices in more detail.

## 1. Project Overview

### 1.1 Context

A web-based real-time chat application for teams, in the spirit of Slack, Teams or Discord, in a professional (B2B) version. It is developed as a school project (25 % of the yearly grade) but is designed, deployed and maintained like a real product, landing page and pricing included.

- **Deadline:** 02/11/2026, 23:59 (GitHub link + PDF report in the Teams assignment).
- **Oral presentation:** first class after the autumn break.

### 1.2 Objectives

- Let users create an account, log in and log out.
- Let users chat in private (1:1) and group conversations.
- Deliver and receive messages in real time, without reloading the page.
- Notify users in real time (badge, toast, unread counter).
- Store users, conversations and messages permanently.
- Control who can access which conversation.
- Deploy the application in production early and keep it running.

## 2. Functional Scope

### 2.1 Mandatory MVP

**User accounts**
- Register with a unique username and a password.
- Log in and log out.
- Passwords are never stored in plain text (Django hashing).

**Conversations**
- View my conversations.
- Start a private conversation with another user.
- Create a group conversation with several participants.
- Open a conversation and read its history.
- Only participants can read or write in a conversation.

**Messages**
- Write and send a text message.
- Receive new messages in real time, without refreshing.
- Read previous messages.
- A message has an author, a conversation, a content and a creation date.
- Messages survive logout, backend restart and redeployment.

**Notifications (in-app minimum)**
- Unread counter per conversation.
- Badge on the conversation list.
- Toast when a message arrives in a conversation that is not open.

**Interface**
- Responsive: usable on desktop and on smaller screens.
- Clear error messages in every form. No stack trace is ever shown to the user.

### 2.2 Product website (assignment requirement)

- Public landing page presenting the benefits of the product.
- Pricing with at least 2 tiers (e.g. Free / Pro) and quotas (messages, attachments, members, retention).
- Clear call to action ("Try it now").

### 2.3 Optional features (to choose, quality over quantity)

Candidates from the assignment: document co-editing, knowledge base, file storage, chatbots, full-text search, or our own idea. Other ideas already listed in `TODO.md`: online status, typing indicator, message editing/deletion, profile picture, image/GIF support, user preferences.

Only one or two will be chosen and integrated properly, once the MVP is stable.

## 3. Actors and Permissions

| Actor | Can | Cannot |
|---|---|---|
| Visitor (not authenticated) | See the landing page and pricing, register, log in | Access any conversation or send a message |
| User (authenticated) | See own conversations, start private and group conversations, send and read messages in own conversations, log out | Read or write in a conversation they are not a participant of |
| Participant of a conversation | Read the history, send messages, add someone, rename a group, see the members | Write to a user who deleted their account |
| Administrator (Django staff) | Manage all data in the Django admin (`/admin/`) | — |

There is no group admin role: every participant of a group has the same rights (kept simple for small teams; see the report).

Permissions are enforced on the backend for every request. The frontend is never trusted.

## 4. Technical Architecture

### 4.1 Stack

| Component | Technology | Status |
|---|---|---|
| Frontend | React 19 (Vite), React Router, Tailwind CSS | Done |
| Backend | Django 6 + Django REST Framework | Done |
| Authentication | JWT (`djangorestframework-simplejwt`), 30 min access, 3 day refresh | Done |
| Cross-origin | `django-cors-headers`, strict allowed origins from `.env` | Done |
| Real-time | Django Channels / WebSockets, served by Daphne (ASGI) | Done |
| Channel layer | In-memory (`InMemoryChannelLayer`) | Done — Redis only if several processes are needed |
| Database | SQLite in development and production, backed up before each deployment | Done — PostgreSQL only if the load requires it |
| Hosting | Debian VPS, Nginx (HTTPS, Let's Encrypt), systemd | Done |
| Containerization | Docker | Not used (one service, deployed by a script) |
| CI/CD | GitHub Actions | Done |

The stack was validated by the teacher. The hosting choice guided the stack: persistence and long WebSocket connections are required, which a VPS provides.

**Why SQLite and an in-memory channel layer.** The backend runs as a single Daphne process for a few dozen users: there are no concurrent writers from several servers, and every WebSocket connection lives in the same process. SQLite is a complete transactional database that needs no server and is backed up by copying a file. PostgreSQL and Redis would add two services to install, secure and monitor for no visible gain at this scale. Moving to them only means changing `DATABASES` and `CHANNEL_LAYERS` in `settings.py`.

### 4.2 Overview

```
Browser (React SPA)
   │  HTTPS (REST, JSON)  +  WSS (WebSocket)
   ▼
Nginx (static frontend, /api and /ws proxied)
   │
   ▼
Daphne (ASGI): Django + DRF + Django Channels
   │                         │
   ▼                         ▼
SQLite                 In-memory channel layer
```

The frontend and the backend are two separate applications, deployed separately. They talk through a JSON API and WebSockets.

### 4.3 Authentication with JWT

Session cookies were tried first and dropped: with frontend and backend on different origins, they require CORS credentials, SameSite and CSRF workarounds. JWT avoids all of that.

- `POST /api/token/` with `username` and `password` returns an `access` token (short-lived) and a `refresh` token (long-lived).
- `POST /api/token/refresh/` returns a new `access` token from a `refresh` token.
- The client sends `Authorization: Bearer <access>` on every request.
- WebSocket authentication: browsers cannot set headers on a WebSocket handshake, so the access token is sent in the query string (`/ws/chat/?token=...`). The consumer refuses the connection if the token is missing, invalid or expired.
- The tokens are stored in `localStorage`. They can be read by JavaScript, so an XSS flaw would expose them; React escapes all displayed text, which limits this risk. `HttpOnly` cookies would be safer but bring back the CSRF problems described above.
- When an access token expires, the frontend uses the refresh token to get a new one and replays the request; if the refresh token has expired too (after 3 days), the user is sent back to the login page.

### 4.4 API (current and planned)

| Endpoint | Purpose | Status |
|---|---|---|
| `POST /api/token/` | Log in, get JWT pair | Done |
| `POST /api/token/refresh/` | Refresh the access token | Done |
| `POST /api/register/` | Create an account | Done |
| `DELETE /api/me/` | Delete my account (password required) | Done |
| `GET /api/conversations/` | List my conversations | Done |
| `POST /api/conversations/` | Start a private or group conversation (an existing private one is returned) | Done |
| `PATCH /api/conversations/<id>/` | Rename a group | Done |
| `GET /api/conversations/<id>/messages/` | Read the history | Done |
| `POST /api/conversations/<id>/messages/` | Send a message | Done |
| `POST /api/conversations/<id>/participants/` | Add a participant (to a private conversation: creates a new group) | Done |
| `WS /ws/chat/?token=<access>` | Real-time events `{type, data}`: `message`, `conversation` | Done |

Logout with JWT is handled on the client (the tokens are discarded). Server-side revocation is out of scope for now.

## 5. Data Model

The class diagram is in `ClassDiagram.puml`.

### 5.1 User

Django's built-in `User` model: unique identifier, unique username, hashed password, `is_active`. Deleting an account sets `is_active` to false and makes the password unusable (soft delete), so the user's messages stay visible to the others.

### 5.2 Conversation

- Identifier.
- `participants`: many-to-many relation with `User`. Django creates the join table automatically. This supports 1:1 and group conversations with the same structure.
- `is_group`: false for a private conversation (exactly 2 participants, only one per pair of users), true for a group. Set by the server.
- `name`: optional, groups only (max 100 characters).
- `created_at`.

### 5.3 Message

- Identifier.
- `author`: foreign key to `User`.
- `conversation`: foreign key to `Conversation`.
- `content`: text.
- `created_at`.

Deleting a user or a conversation deletes the related messages (`CASCADE`).

### 5.4 Migrations and planned changes

- `0001_initial`: conversations and messages.
- `0002`: `is_group` (default false) and `name`.
- `0003`: data migration that marks as groups the conversations created before `0002` with more than two participants.

Still planned: a persistent **unread counter** needs, for each participant, what they have already read (`last_read_at`). The many-to-many will then become an explicit join model (`through=`), which Django can migrate without losing data.

## 6. Real-Time Communication

1. When the chat page opens, the browser opens **one** WebSocket for the user (not one per conversation). The consumer adds it to the user's personal group `user_<id>`.
2. User A sends a message with a normal `POST` request.
3. Django checks that A is a participant, then stores the message in the database.
4. The view sends the event to the personal group of every participant through the channel layer.
5. User B receives it immediately; it appears without refresh.
6. If B has another conversation open, a toast (with sound) and an unread dot are shown.

New conversations, added participants and renamed groups are pushed the same way (`conversation` events). If the connection drops, the frontend reconnects with an increasing delay and reloads what it missed. The in-memory channel layer is enough for a single process; Redis would be needed with several.

## 7. User Interface

Main screens: landing page, pricing, registration, login, conversation list, conversation page with message input, group creation.

Simple and usable first, responsive, with clear error feedback. No complex visual design in the first iteration.

## 8. Security and Quality

- Django authentication and password hashing; JWT for API access.
- Permission check on the backend for every conversation and message.
- All user input is validated and escaped.
- CORS restricted to the exact frontend origin(s); never a wildcard.
- HTTPS in production.
- Secrets in environment variables (`backend/.env`, documented in `.env.example`), never committed. The development `SECRET_KEY` in `settings.py` is only used when `DEBUG` is true: Django refuses to start in production without `DJANGO_SECRET_KEY`.
- `DEBUG = False` in production; error pages never expose stack traces.
- Systematic linting and consistent formatting (`oxlint` for the frontend in the CI).
- Tests on the core: access rights and account deletion (10 tests, run in the CI).

## 9. Git Workflow

- GitHub repository, monorepo: `backend/`, `frontend/`, `docs/`.
- `main` is production; every merge triggers a deployment. It is protected: no direct push, Pull Request required, 1 approval, rule applied to admins too.
- `develop` is the integration branch.
- One `feature/<name>` branch per feature, merged through a reviewed Pull Request.
- Commit messages follow `type: description` (`feat`, `fix`, `chore`, `docs`).
- Requirement: at least one significant PR per person per week, with clear test steps.
- Each `.gitignore` lives in its own folder (`backend/`, `frontend/`).

## 10. CI/CD and Deployment

**CI** (on every Pull Request): lint, build, and tests when they exist.
**CD** (on every merge into `main`): automatic deployment, with a visible build status and accessible logs.

Implemented with GitHub Actions: `ci.yml` (backend tests, frontend lint and build on every PR to `develop` or `main`) and `cd.yml` (the same checks, then SSH to the VPS and `deploy/deploy.sh` on every push to `main`). Backend logs: `journalctl -u canopee` on the server.

Hosting comparison criteria: price, CPU/RAM, storage and persistence, WebSocket support, PostgreSQL and Redis compatibility, GitHub deployment options, secrets handling, logs and monitoring, backups, ease of administration, reliability.

## 11. Constraints

- Interpreted backend language (Python).
- One backend framework and one frontend framework.
- Stack validated by the teacher.
- Public production URL, working at delivery.
- Persistent data, real-time delivery.
- Architecture ready for group conversations and future features.
- Secrets never in the repository.

## 12. Deliverables

- Public production URL.
- GitHub repository (public preferably).
- Project report in **PDF**, with the **names of all group members** (either missing means a grade of 0). It covers: actors, MVP and non-functional requirements, stack justification, architecture schema, UML class diagram, application presentation with screenshots, CI/CD and deployment.
- One AI metacognitive journal per member (template provided).
- Oral presentation.

## 13. Acceptance Scenarios

1. A visitor can register with a unique username.
2. A user can log in and obtains a JWT; wrong credentials are refused with a clear message.
3. A user can log out.
4. A user can start a private conversation and a group conversation.
5. A user can send a message.
6. The other participants receive it without refreshing.
7. A user who is not open on that conversation sees a badge, a toast and an unread counter.
8. Messages are stored in the database.
9. History is still available after logging out and back in.
10. An unauthenticated user cannot read conversations or send messages.
11. A user cannot access a conversation they do not belong to.
12. Restarting the backend does not delete data.
13. The interface is usable on a small screen.

## 14. Current Status (02/11/2026)

**Done**
- Accounts: registration, JWT login with automatic refresh, logout, account deletion (soft delete).
- Private and group conversations, no duplicate private conversation, group name, renaming, member list, adding a participant.
- Messages with history; real-time delivery of messages, new conversations and group changes; WebSocket reconnection.
- Notifications: toast with sound, unread dot (not persistent).
- Landing page, pricing page, team page, profile page; responsive interface.
- Access rights checked on the backend (404 for a conversation the user is not part of); 10 automated tests.
- CI on every pull request, automatic deployment on `main` to a VPS in HTTPS.

**Partial**
- Unread counter: a dot per conversation, lost on reload (acceptance scenario 7 is only partly met).

**Not done**
- Group admin role, leaving a group.
- Optional features from the assignment (files, search, co-editing, chatbot).

The detailed list of next steps is in `TODO.md`.
