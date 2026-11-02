# TODO

Deadline: **02/11/2026, 23:59** (GitHub link + PDF report). Oral presentation after the autumn break.

Legend: **[B]** backend (GeorgéV) · **[F]** frontend (ValentinC) · **[D]** deployment / VPS (ValentinC) · **[All]** both

---

## 🔴 Tonight, before the deadline

- [ ] Add migration `0003_mark_existing_groups.py` to `develop` [B]
- [ ] Merge `feature/docs-and-report` into `develop` (README, docs, report) [All]
- [ ] Merge `develop` into `main`: `main` is 15 commits behind, so **production does not have groups, renaming or the member list yet** [All]
- [ ] Check that the CD run is green, then test in production: register, private conversation, group, rename, member list, real time with two browsers [D]
- [ ] Post the GitHub link and `docs/report/rapport.pdf` on Teams [All]

## 🟠 Before the oral presentation

Linked to the evaluation grid (level 3 = "acquis").

### Data (AA 2.1, AA 2.2)
- [ ] Seeders: a `manage.py seed` command that creates demo users, a private conversation, a named group and some messages [B]
- [ ] Password strength on registration: call `validate_password` in `RegisterSerializer` (the validators are already in `settings.py` but never used) + clear error message in the form [B] [F]
- [ ] Maximum length for a message (`max_length` on `content`) [B]
- [ ] Apply the quotas of the pricing page: maximum 10 members in a free group, and rate limiting on sending messages (DRF throttling) [B]

### Code quality and tests (AA 3.1)
- [ ] Python lint and format in the CI (`ruff check` + `ruff format --check`); today only the frontend is linted [B]
- [ ] Tests for the POST endpoints: send a message, create a conversation (private, group, duplicate), add a participant, rename (200/201, 400, 401, 404) [B]
- [ ] Tests for `register` (valid, duplicate username, weak password) [B]
- [ ] Test for the WebSocket consumer: rejected without token, receives a message (`WebsocketCommunicator`) [B]
- [ ] Django `LOGGING` configuration (errors written to the journal, readable with `journalctl -u canopee`) [B] [D]

### Deployment and collaboration (AA 3.2)
- [ ] "Require status checks to pass" in the protection rules of `main` and `develop` [D]
- [ ] Re-enable "Automatically delete head branches" only if `develop` is protected from deletion [D]

### Presentation (AA 1.2, criterion 6)
- [ ] Slides: need → product → live demo in production → technical choices → difficulties → what we learned [All]
- [ ] Demo accounts and a demo script (two browsers side by side for the real time, a phone for the responsive) [All]
- [ ] AI metacognitive journal, one per member [All]

## 🟡 Cleanup

- [ ] Remove the `uv init` leftovers: `backend/src/`, `[project.scripts]` and `[build-system]` in `pyproject.toml`, then `uv lock` [B]
- [ ] `Conversation.__str__`: `", ".join(...)` instead of `"".join(...)` [B]
- [ ] Remove the unused template files: `src/assets/` (`hero.png`, `react.svg`, `vite.svg`) and `public/icons.svg` [F]

## 🟢 Next features

- [ ] Persistent unread counter: `last_read_at` per participant (ManyToMany → `through=` model) + "mark as read" endpoint + number on the list [B] [F]
- [ ] Sort conversations by last activity [B] [F]
- [ ] Leave a group; group admin role [B] [F]
- [ ] Online status and typing indicator (reuses the WebSocket) [B] [F]
- [ ] Edit / delete a message [B] [F]
- [ ] Message search [B] [F]
- [ ] Images and files [B] [F] [D]
- [ ] Redis channel layer and PostgreSQL, only if the backend needs several processes or the load grows [B] [D]

---

## ✅ Done

### Accounts
- [x] Register with a unique username and a password `POST /api/register/` [B]
- [x] Log in / log out with JWT (`/api/token/`, `/api/token/refresh/`) [B]
- [x] Access token 30 min, refresh token 3 days (`SIMPLE_JWT`) [B]
- [x] Passwords hashed (`create_user`) [B]
- [x] Register and login pages, redirect to login after registration [F]
- [x] Automatic refresh of the access token on 401, redirect to `/login` when the session is expired [F]
- [x] Private pages protected (`RequireAuth`) [F]
- [x] Profile page [F]
- [x] Account deletion `DELETE /api/me/` (password required, soft delete: `is_active = False`) [B] [F]

### Conversations and messages
- [x] `Conversation` and `Message` models, migrations, admin [B]
- [x] List my conversations `GET /api/conversations/` [B]
- [x] Private and group conversations (`is_group`, `name`), no duplicate private conversation [B]
- [x] Adding someone to a private conversation creates a new group (the private one doesn't change) [B]
- [x] Rename a group `PATCH /api/conversations/<id>/` [B]
- [x] Migration `0003`: mark old conversations with more than 2 participants as groups [B]
- [x] Read the history and send a message `/api/conversations/<id>/messages/` [B]
- [x] Only participants can read, write, add someone or rename (404 otherwise) [B]
- [x] Usernames in the API (`UserSerializer` with `is_active`, `author_name`) [B]
- [x] Chat page: list, messages, send, create a conversation or a group, add participant, rename, member list [F]
- [x] "This person left Canopée" instead of the input in a private conversation with a deleted account [F]
- [x] No double sending of a message [F]

### Real time
- [x] Django Channels + Daphne (ASGI), one WebSocket per user authenticated with the JWT [B]
- [x] New messages, new conversations, added participants and renamed groups pushed in real time (`{type, data}`) [B]
- [x] Real-time display in the chat page, without duplicates [F]
- [x] Automatic WebSocket reconnection (fresh token, increasing delay, reload of what was missed) [F]
- [x] Toast with sound and unread dot on conversations that are not open (not persistent) [F]

### Product website
- [x] Landing page, pricing page (monthly / yearly, quotas), team page [F]
- [x] Responsive interface (one column with a back button on small screens) [F]

### Quality and deployment
- [x] 10 backend tests: access rights and account deletion [B]
- [x] CI on every PR: backend tests + frontend lint and build [B] [F]
- [x] Production settings from `.env` (`SECRET_KEY`, `DEBUG`, hosts, CORS), `.env.example` [D]
- [x] Nginx (HTTPS, API, WebSockets) and systemd configuration [D]
- [x] CD: automatic deployment on every push to `main` (backup, migrations, build, restart, HTTP check) [D]
- [x] Production URL: https://canopee.coisnevalentin.be [D]

### Documentation
- [x] Devlog up to date (`docs/DEVLOG.md`) [B]
- [x] README with setup, API and deployment; `ProjectSpecifications.md` and `ClassDiagram.puml` updated [B]
- [x] Progress reports and final report (`docs/report/`) [All]
