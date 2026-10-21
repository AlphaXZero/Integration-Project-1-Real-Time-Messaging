# TODO

Deadline: **02/11/2026, 23:59** (GitHub link + PDF report). Oral presentation after the autumn break.

Legend: **[B]** backend (GeorgéV) · **[F]** frontend (ValentinC) · **[D]** deployment / VPS (ValentinC) · **[All]** both

---

## ✅ Done

### Accounts
- [x] Register with a unique username and a password `POST /api/register/` [B]
- [x] Log in / log out with JWT (`/api/token/`, `/api/token/refresh/`) [B]
- [x] Passwords hashed (`create_user`) [B]
- [x] Register and login pages, redirect to login after registration [F]
- [x] Automatic refresh of the access token on 401 [F]
- [x] Private pages protected (`RequireAuth`) [F]
- [x] Profile page [F]

### Conversations and messages
- [x] `Conversation` and `Message` models, migrations, admin [B]
- [x] List my conversations `GET /api/conversations/` [B]
- [x] Create a conversation (private or group) by usernames `POST /api/conversations/` [B]
- [x] Read the history `GET /api/conversations/<id>/messages/` [B]
- [x] Send a message `POST /api/conversations/<id>/messages/` [B]
- [x] Add a participant to a conversation `POST /api/conversations/<id>/participants/` [B]
- [x] Only participants can read, write or add someone (404 otherwise) [B]
- [x] Usernames in the API (`UserSerializer`, `author_name`) [B]
- [x] Chat page: conversation list, messages, send, create conversation, add participant [F]
- [x] No double sending of a message [F]

### Real time
- [x] Django Channels + Daphne (ASGI) [B]
- [x] WebSocket authenticated with the JWT (`ws/chat/?token=...`) [B]
- [x] One personal group per user (`user_<id>`) [B]
- [x] New messages, new conversations and added participants pushed in real time [B]
- [x] Typed events `{type, data}` (`message` / `conversation`) [B]
- [x] Real-time display in the chat page, without duplicates [F]
- [x] Unread dot on conversations that are not open (not persistent) [F]

### Product website
- [x] Landing page [F]
- [x] Pricing page [F]
- [x] Team page [F]

### Quality and deployment
- [x] Backend tests for the GET endpoints (conversations, messages, access rights) [B]
- [x] CI on every PR: backend tests + frontend lint and build [B] [F]
- [x] Production settings from `.env` (`SECRET_KEY`, `DEBUG`, hosts, CORS) [D]
- [x] Nginx (HTTPS, API, WebSockets) and systemd configuration [D]
- [x] Devlog up to date (`docs/DEVLOG.md`) [B]

---

## 🔴 Mandatory for the deadline

### Notifications (spec §2.1, acceptance scenario 7)
- [ ] Persistent unread counter per conversation: `last_read_at` per participant (ManyToMany → `through=` model) + "mark as read" endpoint [B]
- [ ] Show the unread counter on the conversation list [F]
- [ ] Toast when a message arrives in a conversation that is not open [F]

### Real time
- [ ] Automatic WebSocket reconnection (with a fresh token) [F]
- [ ] Redis as the channel layer in production [B] [D]

### Accounts
- [ ] Access token lifetime (`SIMPLE_JWT`, 30 min) merged into `develop` [B]
- [ ] Password strength check on registration (`validate_password`) [B]
- [ ] Clear error message for each case (e.g. "add participant" shows "user not found" for every error) [F]
- [ ] Redirect to `/login` when the session is expired [F]

### Tests (spec §8)
- [ ] POST endpoints: send a message, create a conversation, add a participant (200/201, 400, 401, 404) [B]
- [ ] `register`: valid, duplicate username, weak password [B]
- [ ] WebSocket consumer: rejected without token, receives a message (`WebsocketCommunicator`) [B]

### Deployment (spec §10–11)
- [ ] Merge `develop` into `main` (main is far behind) [All]
- [ ] Public production URL working [D]
- [ ] PostgreSQL in production [D]
- [ ] CD: automatic deployment on every merge into `main` [D]
- [ ] "Require status checks" in the `main` protection rule [D]

### Deliverables (spec §12)
- [ ] Final PDF report with both names (actors, requirements, stack justification, architecture schema, UML diagram, screenshots, CI/CD and deployment) [All]
- [ ] AI metacognitive journal, one per member [All]
- [ ] Oral presentation [All]

---

## 🟠 Important

- [ ] Don't create a duplicate private conversation with the same person: return the existing one [B]
- [ ] Groups: optional name and type (private / group) [B] [F]
- [ ] Sort conversations by last activity [B]
- [ ] Check the interface on small screens (acceptance scenario 13) [F]
- [ ] `Conversation.__str__`: use `", ".join` instead of `"".join` [B]

## 🟡 Cleanup and documentation

- [ ] README: fix broken links (`DEVLOG.md`, `ProjectSpecifications.md`, `ClassDiagram.puml`) and hosting "TBD" [All]
- [ ] `ProjectSpecifications.md`: update the "Status" tables (§4.1, §4.4) and §14 [All]
- [ ] `ClassDiagram.puml`: update (needed for the report) [B]
- [ ] Remove `uv init` leftovers: `backend/src/backend/` and `[project.scripts]` in `pyproject.toml` [B]

---

## 🟢 Optional (spec §2.3, one or two, once the MVP is stable)

- [ ] Online status + typing indicator (reuses the WebSocket)
- [ ] Edit / delete a message
- [ ] Profile picture
- [ ] Image / GIF support
- [ ] File attachments
- [ ] Message search
- [ ] User preferences / UI personalization
- [ ] Sound notifications
- [ ] Auto-moderation, AI fact-checking