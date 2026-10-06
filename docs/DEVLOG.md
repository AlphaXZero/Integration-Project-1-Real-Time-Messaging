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
## Backend: user registration endpoint

### Serializer
A serializer converts a Python/model object into JSON (and back), validating the data along the way — same role as `ModelForm` played earlier, just for JSON instead of HTML.

`accounts/serializers.py`
```python
from rest_framework import serializers
from django.contrib.auth.models import User


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"], password=validated_data["password"]
        )
```
`model`, `fields` and `extra_kwargs` come from the `Meta` class:
- `model` tells the serializer which Django model to inspect for its fields.
- `fields` lists which fields to expose, in and out.
- `extra_kwargs` tweaks how a specific field behaves without redefining it entirely — here, `write_only` means `password` is accepted on input but never included in the JSON response.

`create()` must call `User.objects.create_user(...)`, not `User.objects.create(...)`: the former hashes the password before saving, the latter would store it in plain text.

**Gap**: `ModelSerializer` validates what the model already constrains (username uniqueness, required fields), but not password strength — `UserCreationForm` used to run Django's `AUTH_PASSWORD_VALIDATORS` automatically, this serializer doesn't. Added to `TODO.md` for later (a `validate_password` method calling `django.contrib.auth.password_validation.validate_password`).

### View
`accounts/views.py`
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view_api(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)
```
`@api_view` bridges plain Django and DRF: it turns the incoming request into DRF's `Request` (giving `request.data`, parsed from JSON), turns the returned `Response` into a real HTTP response, restricts which HTTP methods are allowed (`["POST"]`), and is what makes `@permission_classes` work at all — it has to sit above it.

`AllowAny` is needed because registration must be reachable by visitors with no account yet, unlike `conversation_list` which requires `IsAuthenticated`.

`serializer.save()` is what actually calls `create()` — never call `create()` directly, it would skip validation.

### Routes
`accounts/urls.py`:
```python
from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register_view_api),
]
```

`config/urls.py`:
```python
from django.urls import path, include

...
(path("api/", include("accounts.urls")),)
```
Prefix stops at `api/` — the `register/` part comes from `accounts/urls.py` itself, so the two don't get concatenated into `api/register/register/`.

### Testing

With the server running:
```bash
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test1", "password": "unmotdepasse123"}'
```
Returns `{"id": 2, "username": "test1"}` — no password in the response, thanks to `write_only`.

Repeating the exact same request returns a clear validation error instead of a crash: `username` is `unique=True` on the `User` model, and `ModelSerializer` generates that check automatically from the model constraint, no extra code needed.

Confirms the full flow (register → login) by requesting a JWT with the same credentials:
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test1", "password": "unmotdepasse123"}'
```
Returns `access` + `refresh` — the account created through `/api/register/` can log in through SimpleJWT's existing `/api/token/`. No separate "login view" was needed here: JWT only required a registration endpoint, since SimpleJWT already provides login out of the box.

## Backend : conversations GET endpoint

### Create the models
```python
from django.db import models
from django.contrib.auth.models import User


class Conversation(models.Model):
    participants = models.ManyToManyField(User)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return ", ".join(user.username for user in self.participants.all())


class Message(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
```
ManyToMany takes care of the n..n relation for us (Django creates the join table automatically). ForeignKey creates a direct link between two tables (one row points to exactly one row of the other table).


```bash
uv run manage.py makemigrations chat
uv run manage.py migrate
```

### Register models in admin
To create test data (conversations/messages) without building the write endpoints first:
```python
from django.contrib import admin
from .models import Conversation, Message

admin.site.register(Conversation)
admin.site.register(Message)
```

### Create the serializers
```python
from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["author", "conversation", "created_at", "content"]


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["participants", "created_at"]
```

### Create the views
```python
from rest_framework import generics, permissions
from .models import Conversation
from .serializers import ConversationSerializer


class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)
```
Only returns conversations where the logged-in user is a participant — matches the spec rule "cannot read conversations you're not part of".

### Create the urls
```python
from django.urls import path
from .views import ConversationListView, MessageListView

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
]
```
and `path("api/", include("chat.urls"))` in the project's `config/urls.py`.

### Testing
```bash
curl -H "Authorization: Bearer <access_token>" http://localhost:8000/api/conversations/
```
→ returns only the conversations the authenticated user participates in.

---

## Backend: Messages list GET

### Create the view
```python
class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs["conversation_id"]
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants=self.request.user,
        )
```

### Update the urls
```python
urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path(
        "conversations/<int:conversation_id>/messages/",
        MessageListView.as_view(),
        name="message-list",
    ),
]
```

### Testing
```bash
curl -H "Authorization: Bearer <access_token>" http://localhost:8000/api/conversations/1/messages/
```
→ returns the messages of conversation #1 if the user is a participant, `[]` otherwise (even if the conversation exists) — no information is leaked about conversations the user doesn't belong to.

### how to fetch in frontend
```
const BASE_URL = "http://localhost:8000/api";

export async function getConversations() {
  const response = await fetch(`${BASE_URL}/conversations/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}
```
return a list with every conversation where the user participate
[{id,paricipants: [2:"loic",3], created-at:xxx}]
```
export async function getMessages(conversationId) {
  const response = await fetch(
    `${BASE_URL}/conversations/${conversationId}/messages/`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    },
  );

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}
```
return somethin like that
[
  {
    id: 1,
    author: 2,
    conversation: 1,
    created_at: "2026-09-29T18:57:18.926459Z",
    content: "test message",
  },
  {
    id: 2,
    author: 3,
    conversation: 1,
    created_at: "2026-09-29T18:58:02.114872Z",
    content: "salut !",
  },
]

## backend: message post
i changed the views to accept post
```python
class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs["conversation_id"]
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants=self.request.user,
        ).order_by("created_at")

    def perform_create(self, serializer):
        conversation = get_object_or_404(
            Conversation,
            id=self.kwargs["conversation_id"],
            participants=self.request.user,
        )
        serializer.save(author=self.request.user, conversation=conversation)
```
now we herits from generics.ListCreateAPIView instead of ListAPIView,
i also set every fields in the serializers to be in read only except content so an user cant write in another conversation where hes not in.
In the perform_create() we check if the user is in the conversation by looking every conversations then we save

### how to fetch
```export async function sendMessage(conversationId, content) {
  const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw await response.json();
  }
  return await response.json();
}
```

## backend : modify Serializers chat
### message
first of all i added author_name in the serizalizer in order to show the name of the user in the frontend
```
class MessageSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "author",
            "author_name",
            "conversation",
            "created_at",
            "content",
        ]
        read_only_fields = [
            "id",
            "author",
            "conversation",
            "created_at",
        ]

```
then i changed the conversation serizalizer to send every participants username of the conversation
### conversatoin
#### Problem
The frontend only received user ids (`"author": 1`, `"participants": [1, 2]`), so it had no way to display names.

#### Message author name
```python
author_name = serializers.CharField(source="author.username", read_only=True)
```
`source` accepts a dotted path to follow a relation: DRF reads `message.author.username`. Nothing is stored twice in the database, the name always comes from `User`.

#### Nested serializer for participants
```python
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]
```
Only `id` and `username` are exposed, never `password` or `email`. It is then reused in `ConversationSerializer` with `participants = UserSerializer(many=True, read_only=True)`, so the API returns `[{"id": 1, "username": "..."}, ...]`.

#### Reading vs writing
A nested serializer is read-only, so it cannot be used to create a conversation. Two fields are used instead:
- `participants`: output, list of `{id, username}`
- `participant_ids`: input (`write_only`), list of ids, validated against `User.objects.all()` so unknown ids return a 400

```python
participant_ids = serializers.PrimaryKeyRelatedField(
    many=True,
    queryset=User.objects.all(),
    write_only=True,
    source="participants",
)
```
`source="participants"` makes the validated data land in `validated_data["participants"]`, so `perform_create` is unchanged.

#### Key learnings
- A declared serializer field goes above `class Meta`, not inside it.
- `list.append()` returns `None`: use `list + [item]` when you need the new list.
- Showing data and accepting data are two different jobs: a field can be `read_only` or `write_only`, and the same model field can have one of each.

## Backend: WebSocket (Django Channels)

### Why
With plain HTTP the server can only answer requests: when Marie posts a message, Valentin doesn't see it until his page fetches the messages again. A WebSocket keeps a connection open in both directions, so the server can **push** new messages to the client instantly.

Design choice:
- **Sending** a message stays on the existing `POST /api/conversations/<id>/messages/` (already validated, secured and tested).
- **Receiving** in real time goes through the WebSocket.
- **One WebSocket per user** (`ws/chat/`), not one per conversation: the frontend opens a single connection, and each user joins their own group `user_<id>`. This also makes it possible to notify about messages in conversations that aren't currently open.

### Installation
```bash
uv add channels daphne
```
- **Channels**: adds WebSocket support to Django (consumers, routing, groups).
- **Daphne**: an ASGI server that replaces the default `runserver`.

### Settings (`config/settings.py`)
```python
INSTALLED_APPS = [
    "daphne",  # must be first, so its runserver overrides Django's
    "django.contrib.admin",
    # ...
    "rest_framework",
    "channels",
    "accounts",
    "chat",
]

ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"},
}
```
- **WSGI** (Web Server Gateway Interface) handles one request → one response, then the connection closes.
- **ASGI** (Asynchronous Server Gateway Interface) also supports long-lived connections like WebSockets, and can handle many open connections at the same time without blocking.
- **Channel layer**: the internal messaging system used to send a message from one connection to others (through groups). In-memory is fine for development; it will be replaced by Redis for production.

Check that it works:
```bash
uv run manage.py runserver
```
```
Starting ASGI/Daphne version 4.2.3 development server at http://127.0.0.1:8000/
```
The API still works as before.

### Consumer (`chat/consumers.py`)
A consumer is the WebSocket equivalent of a view. Instead of one function per request, it's a class whose methods are called on events (connect, receive, disconnect).

First version: an echo consumer, to check the whole chain works.
Second version: authentication with the JWT.

```python
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # read the token from the URL (?token=...)
        query = parse_qs(self.scope["query_string"].decode())
        token = query.get("token", [None])[0]

        # no token → reject
        if not token:
            await self.close()
            return

        # invalid or expired token → reject
        try:
            self.user_id = AccessToken(token)["user_id"]
        except TokenError:
            await self.close()
            return

        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        await self.send(text_data=text_data)  # echo, temporary
```

Why the token is in the URL: the browser's `WebSocket` API can't set headers, so `Authorization: Bearer ...` isn't possible like with `fetch`.

### Routing (`chat/routing.py`)
The WebSocket equivalent of `urls.py`:
```python
from django.urls import path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    path("ws/chat/", ChatConsumer.as_asgi()),
]
```
Nothing to add in `config/urls.py`: it only handles HTTP.

### ASGI entry point (`config/asgi.py`)
```python
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# must run before importing anything that uses the models
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,  # the REST API, unchanged
        "websocket": URLRouter(websocket_urlpatterns),  # WebSocket connections
    }
)
```
`ProtocolTypeRouter` sends each connection to the right place depending on its type.

### Testing (browser console)
```javascript
// no token → connection closed
const ws1 = new WebSocket("ws://localhost:8000/ws/chat/");
ws1.onclose = () => console.log("closed (expected)");

// valid token → connection open, echo works
const ws2 = new WebSocket(`ws://localhost:8000/ws/chat/?token=${localStorage.getItem("access")}`);
ws2.onmessage = (e) => console.log("received:", e.data);
ws2.onopen = () => ws2.send("hello");
```

### Key learnings
- **`self` vs the parent class**: `self.accept()`, not `AsyncWebsocketConsumer.accept()`. The class is the generic blueprint; `self` is the consumer of *this* connection.
- **Events vs actions**: `connect`, `receive` and `disconnect` are called *by* Channels (events). `accept`, `send` and `close` are called *by me* (actions). To reject a connection, use `close()`, not `disconnect()`.
- **`AccessToken(None)` doesn't fail**: without an argument, simplejwt creates a brand-new valid token. The "no token" check must come before it, otherwise a connection without a token would be accepted.
- `async` / `await` work like in JavaScript: while one connection waits, the server handles the others.

### Next
Groups: each connection joins `user_<id>`, and the `POST` view sends every new message to the group of each participant.


## Decisions carried over from the exploration phase
(to be implemented, not yet done in the clean project)
- SQLite in development, PostgreSQL only at deployment time.
- `.env` for secrets from the start (`SECRET_KEY`, etc.).
- API-only backend — no HTML auth views, everything through DRF for React to consume.