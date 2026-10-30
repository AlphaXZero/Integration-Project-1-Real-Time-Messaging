# Project Specifications

**Real-Time Messaging Application (B2B)**
Integration Project 1 — Team of 2 — Version 2.0 (September 2026)

This document replaces version 1.0. It reflects the architecture actually chosen (React + Django REST + JWT) and the requirements of the course assignment.

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
| Group admin *(to be defined)* | Manage the participants of a group | — |

Permissions are enforced on the backend for every request. The frontend is never trusted.

## 4. Technical Architecture

### 4.1 Stack

| Component | Technology | Status |
|---|---|---|
| Frontend | React (Vite) | Initialized |
| Backend | Django + Django REST Framework | Initialized |
| Authentication | JWT (`djangorestframework-simplejwt`) | Token endpoints working |
| Cross-origin | `django-cors-headers`, strict allowed origins | Configured (dev origin) |
| Real-time | Django Channels / WebSockets | To do |
| Channel layer | Redis | To do |
| Database | SQLite in development, PostgreSQL in production | SQLite in use |
| Hosting | VPS (OVH or Hostkey, to be decided) | To decide |
| Containerization | Docker (to be decided) | To decide |
| CI/CD | GitHub Actions | To do |

The stack must be validated by the teacher before development goes further. The hosting choice guides the stack: persistence and WebSocket support are required.

### 4.2 Overview

```
React (SPA)
   │  HTTP (REST, JSON)  +  WebSocket
   ▼
Django + DRF + Django Channels
   │                    │
   ▼                    ▼
PostgreSQL            Redis
```

The frontend and the backend are two separate applications, deployed separately. They talk through a JSON API and WebSockets.

### 4.3 Authentication with JWT

Session cookies were tried first and dropped: with frontend and backend on different origins, they require CORS credentials, SameSite and CSRF workarounds. JWT avoids all of that.

- `POST /api/token/` with `username` and `password` returns an `access` token (short-lived) and a `refresh` token (long-lived).
- `POST /api/token/refresh/` returns a new `access` token from a `refresh` token.
- The client sends `Authorization: Bearer <access>` on every request.
- Open point: browsers cannot set headers on a WebSocket handshake, so the WebSocket authentication method (token in the query string or in a first message) has to be decided.
- Open point: where the frontend stores the token (memory or `localStorage`) and the security trade-off.

### 4.4 API (current and planned)

| Endpoint | Purpose | Status |
|---|---|---|
| `POST /api/token/` | Log in, get JWT pair | Done |
| `POST /api/token/refresh/` | Refresh the access token | Done |
| `POST /api/register/` | Create an account | To do |
| `GET /api/conversations/` | List my conversations | To do |
| `POST /api/conversations/` | Start a private or group conversation | To do |
| `GET /api/conversations/<id>/messages/` | Read the history | To do |
| `POST /api/conversations/<id>/messages/` | Send a message | To do |
| `WS /ws/...` | Real-time delivery and notifications | To do |

Logout with JWT is handled on the client (the tokens are discarded). Server-side revocation is out of scope for now.

## 5. Data Model

The class diagram is in `class_diagram.puml`.

### 5.1 User

Django's built-in `User` model: unique identifier, unique username, hashed password.

### 5.2 Conversation

- Identifier.
- `participants`: many-to-many relation with `User`. Django creates the join table automatically. This supports 1:1 and group conversations with the same structure.
- `created_at`.

### 5.3 Message

- Identifier.
- `author`: foreign key to `User`.
- `conversation`: foreign key to `Conversation`.
- `content`: text.
- `created_at`.

Deleting a user or a conversation deletes the related messages (`CASCADE`).

### 5.4 Planned model changes

A simple many-to-many was chosen on purpose (start simple). The assignment adds needs that will probably require changes:

- **Unread counters:** need to know, for each participant, what they have already read. This means a per-participant marker (e.g. `last_read_at`), so the many-to-many will likely become an explicit join model (`through=`).
- **Groups:** a conversation type (private/group) and an optional name.

Django can migrate a simple many-to-many to a `through` model. The decision will be taken when the notifications feature starts.

## 6. Real-Time Communication

1. User A opens a conversation; the browser opens a WebSocket to the backend.
2. User A sends a message.
3. Django checks that A is a participant, then stores the message in the database.
4. Django broadcasts the event to the other participants through the channel layer.
5. User B receives it immediately; it appears without refresh.
6. If B has another conversation open, a badge, a toast and the unread counter are updated.

Django Channels manages the connections. Redis is the channel layer, needed as soon as the backend runs with several processes.

## 7. User Interface

Main screens: landing page, pricing, registration, login, conversation list, conversation page with message input, group creation.

Simple and usable first, responsive, with clear error feedback. No complex visual design in the first iteration.

## 8. Security and Quality

- Django authentication and password hashing; JWT for API access.
- Permission check on the backend for every conversation and message.
- All user input is validated and escaped.
- CORS restricted to the exact frontend origin(s); never a wildcard.
- HTTPS in production.
- Secrets in environment variables, never committed. **Current gap:** the development `SECRET_KEY` is still in `settings.py`; it will be moved to a `.env` file, and production will use a new key.
- `DEBUG = False` in production; error pages never expose stack traces.
- Systematic linting and consistent formatting.
- Tests on the core: sending/reading a message and access rights.

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

The pipeline starts as a basic one (course 2) and is enriched during the year. Once it exists, "require status checks" will be enabled in the `main` protection rule.

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

## 14. Current Status

**Done**
- Monorepo structure, GitHub repository, `main` protection rule.
- Django + DRF project with `accounts` and `chat` apps.
- CORS configuration for the development origin.
- JWT token and refresh endpoints, tested.
- React (Vite) frontend initialized.

**Next**
1. Registration endpoint.
2. Conversation and message models, migrations, admin.
3. Conversation and message API with permission checks.
4. Login screen and conversation list in React.
5. Move the secret key to `.env`.
6. WebSockets with Django Channels.
7. Notifications.
8. CI/CD, hosting choice, deployment.
9. Landing page, pricing, responsive polish.
10. PostgreSQL in production, then optional features.