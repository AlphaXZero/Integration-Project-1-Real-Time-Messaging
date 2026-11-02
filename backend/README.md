# Canopée — backend

Django 6 + Django REST Framework API and Django Channels WebSockets for Canopée.

- `accounts/`: registration (`POST /api/register/`) and account deletion (`DELETE /api/me/`)
- `chat/`: `Conversation` and `Message` models, REST views, WebSocket consumer (`ws/chat/`)
- `config/`: settings (read from environment variables in production), URLs, ASGI entry point

```bash
uv sync
uv run manage.py migrate
uv run manage.py runserver   # http://localhost:8000, WebSockets included (Daphne)
uv run manage.py test                       # 45 tests
uv run ruff check . && uv run ruff format .  # lint and format (also checked by the CI)
```

Production variables: see `.env.example`. Setup, API and deployment are described in the [main README](../README.md).
