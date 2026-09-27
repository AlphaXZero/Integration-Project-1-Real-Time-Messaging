# Real-Time Chat Application

A real-time web-based chat application, developed as a school project by a team of 2.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Backend | Django / Django REST Framework |
| Real-time communication | Django Channels / WebSockets |
| Database | PostgreSQL (SQLite in development) |
| Real-time channel layer | Redis |
| Hosting | VPS (OVH or Hostkey — TBD) |

## Project Structure

    .
    ├── backend/    Django REST API
    ├── frontend/   React application
    └── docs/       Specifications, diagrams, learning notes, todo list

## Core Features (MVP)

- User registration and authentication
- One-to-one conversations
- Real-time messaging (no page refresh)
- Persistent message history
- Database structure ready for future group conversations

## Getting Started

**Backend**

    cd backend
    uv sync
    uv run manage.py migrate
    uv run manage.py runserver

**Frontend**

    cd frontend
    npm install
    npm run dev

## Documentation

- [`docs/Project_specifications.md`](docs/Project_specifications.md) — full project specifications
- [`docs/class_diagram.puml`](docs/class_diagram.puml) — data model
- [`docs/TODO.md`](docs/TODO.md) — planned features and roadmap
- [`docs/LEARNING.md`](docs/LEARNING.md) — development notes and learnings