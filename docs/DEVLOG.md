# Development Log

## 1. Project setup

### Structure
The project restarted from scratch with a cleaner architecture: one repository (monorepo) with three folders.

```
.
├── backend/    Django + Django REST Framework (API only)
├── frontend/   React (Vite)
└── docs/       specs, diagrams, this log
```

One repo instead of two: simpler for a 2-person team, and both parts are deployed together.

### Git workflow
- `main`: stable code only, what gets deployed.
- `develop`: where finished features are merged.
- `feature/<name>`: one branch per feature, merged into `develop` with a Pull Request.
- Commit messages: `type: short description`, with `feat`, `fix`, `chore` or `docs`.

Before creating a branch, always start from an up-to-date `develop`:
```bash
git checkout develop
git pull
git checkout -b feature/my-feature
```

### Documentation
- `README.md`: project overview, tech stack, how to run it.
- `docs/TODO.md`: backlog (Important / Nice to have).
- `docs/DEVLOG.md`: this file.
- `docs/ProjectSpecifications.md` and `docs/ClassDiagram.puml`: original specs.

### Initialisation
Backend:
```bash
cd backend
uv init
uv add django djangorestframework
uv run django-admin startproject config .
uv run manage.py startapp accounts
uv run manage.py startapp chat
```
`rest_framework`, `accounts` and `chat` must be added to `INSTALLED_APPS` in `config/settings.py`. Creating the folder is not enough.

Frontend:
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev
```

---

## 2. Backend: CORS

React runs on `localhost:5173` and Django on `localhost:8000`. For the browser, these are two different sites, so it blocks React from reading Django's answers unless Django allows it.

```bash
uv add django-cors-headers
```

In `config/settings.py`:
```python
INSTALLED_APPS = [..., "corsheaders"]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # must be first
    ...,
]

CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
```
Later, for deployment, this list is read from an environment variable (`DJANGO_CORS_ALLOWED_ORIGINS`), with `http://localhost:5173` as the default in development.

---

## 3. Backend: JWT authentication

**JWT**: instead of a session cookie, the user gets a signed token and sends it in a header with every request.

```bash
uv add djangorestframework-simplejwt
```

Use JWT by default for every API view (`config/settings.py`):
```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}
```

SimpleJWT already provides the login views (`config/urls.py`):
```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
```
- `POST /api/token/` with `username` + `password` → returns an `access` token (short-lived, sent with every request) and a `refresh` token (long-lived, used to get a new `access`).
- `POST /api/token/refresh/` with the `refresh` token → returns a new `access` token.

Test:
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "...", "password": "..."}'
```

**Gotcha**: the first try returned an HTML error page (`OperationalError`). The new database had no tables. Fix: `uv run manage.py migrate`, then `uv run manage.py createsuperuser`.

---

## 4. Backend: registration (`POST /api/register/`)

### Serializer (`accounts/serializers.py`)
A **serializer** converts Python objects to JSON (and JSON back to Python), and validates the data on the way in.

```python
from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )
```
- `model`: which model the serializer is based on.
- `fields`: which fields are accepted and returned.
- `write_only`: the password is accepted, but never sent back in the response.
- `create_user()` **hashes** the password. `create()` would store it in plain text.

**Still to do**: password strength is not checked yet (Django's `validate_password`).

### View (`accounts/views.py`)
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

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
- `@api_view(["POST"])`: turns a normal Django function into a DRF view (gives `request.data`, only accepts POST).
- `AllowAny`: anyone can register, even without an account.
- `serializer.save()` calls `create()` for us, after validation.

### URLs
`accounts/urls.py`:
```python
urlpatterns = [path("register/", views.register_view_api)]
```
`config/urls.py`:
```python
(path("api/", include("accounts.urls")),)
```
The final URL is `api/` + `register/` = `/api/register/`.

### Test
```bash
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test1", "password": "unmotdepasse123"}'
```
→ `{"id": 2, "username": "test1"}`: no password in the response.
Sending the same request twice returns an error: `username` is unique in the `User` model, and the serializer checks it automatically.
The new account can then log in with `/api/token/`.

---

## 5. Backend: chat models

`chat/models.py`:
```python
from django.contrib.auth.models import User
from django.db import models


class Conversation(models.Model):
    participants = models.ManyToManyField(User)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"conversation {self.id} {''.join(user.username for user in self.participants.all())}"


class Message(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
```
- `ManyToManyField`: a conversation has many users, a user has many conversations. Django creates the join table.
- `ForeignKey`: a message belongs to exactly one author and one conversation.
- `on_delete=CASCADE`: deleting a conversation also deletes its messages.
- `auto_now_add=True`: the date is filled in automatically at creation.
- `__str__`: only used for display in the admin and the shell.

```bash
uv run manage.py makemigrations chat
uv run manage.py migrate
```

To create test data before the API exists, register the models in `chat/admin.py`:
```python
admin.site.register(Conversation)
admin.site.register(Message)
```

---

## 6. Backend: chat API

### Endpoints
| Method | URL | What it does |
|---|---|---|
| GET | `/api/conversations/` | my conversations |
| POST | `/api/conversations/` | create a conversation |
| GET | `/api/conversations/<id>/messages/` | messages of a conversation |
| POST | `/api/conversations/<id>/messages/` | send a message |

All of them require a valid token: `Authorization: Bearer <access_token>`.

### Serializers (`chat/serializers.py`)
```python
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Conversation, Message


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]  # never password or email


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
        read_only_fields = ["id", "author", "conversation", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)  # output
    participant_usernames = serializers.SlugRelatedField(  # input
        many=True,
        queryset=User.objects.all(),
        slug_field="username",
        write_only=True,
        source="participants",
    )

    class Meta:
        model = Conversation
        fields = ["id", "participants", "participant_usernames", "created_at"]
```

What each part does:
- **`read_only_fields`**: for a message, the client can only send `content`. `author` and `conversation` are set by the server, so nobody can post as someone else or in someone else's conversation.
- **`author_name`**: `source="author.username"` follows the relation and reads the author's name. Nothing is stored twice in the database.
- **`UserSerializer`** inside `ConversationSerializer`: participants are returned as `{id, username}` instead of plain ids, so the frontend can show names.
- **Reading vs writing**: a nested serializer can only be read. So there are two fields:
  - `participants` (read): list of `{id, username}`
  - `participant_usernames` (write): list of **usernames** sent when creating a conversation. `SlugRelatedField` finds each user by its `username` (`slug_field`). Unknown username → 400.
  - `source="participants"` puts the users found in `validated_data["participants"]`.
- **Why usernames and not ids**: at first the client sent ids (`participant_ids`). But to start a conversation with someone new, the frontend doesn't know their id, only their name. With usernames, the person just types a name.

### Views (`chat/views.py`)
```python
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationListView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        new_list = serializer.validated_data["participants"] + [self.request.user]
        serializer.save(participants=new_list)


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
- **`ListCreateAPIView`**: one URL handles both GET (list) and POST (create).
- **`get_queryset`**: decides which objects can be read. Here, only the user's own conversations, and only messages from conversations they are in.
- **`perform_create`**: runs before saving, to add what the client is not allowed to send.
  - Creating a conversation: the creator is always added to the participants.
  - Sending a message: `get_object_or_404` finds the conversation **only if the user is a participant**. Otherwise → 404.
- **`self.kwargs["conversation_id"]`**: the value from the URL `<int:conversation_id>`.
- **`order_by("created_at")`**: without it, the database doesn't guarantee any order.

### URLs
`chat/urls.py`:
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
and `path("api/", include("chat.urls"))` in `config/urls.py`.

### Examples
```bash
# list my conversations
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/conversations/

# create a conversation with valentin
curl -X POST http://localhost:8000/api/conversations/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"participant_usernames": ["valentin"]}'

# send a message
curl -X POST http://localhost:8000/api/conversations/1/messages/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "hello"}'
```
Expected results:
- A non-participant gets `[]` on the messages list, and 404 when posting: no information leaks about other conversations.
- No token → 401.

### Key learnings
- **`__` in filters** crosses a relation: `conversation__participants` goes from `Message` to `Conversation` to its participants. `conversation_id` works directly because it is a real column of `Message`.
- **A declared serializer field goes above `class Meta`**, not inside it.
- **`list.append()` returns `None`**: use `list + [item]` to get the new list.
- **`get_object_or_404`** is a function to import from `django.shortcuts`, not a method of `self`.

---

## 7. Backend: automated tests and CI

### Why
Testing by hand with `curl` works once, but it has to be redone after every change. Automated tests check the rules every time, in a few seconds.

### Tests (`chat/tests.py`)
Django creates an **empty test database** for each run, so the tests never touch the real data.

```python
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Conversation, Message


class MessageListViewTest(APITestCase):
    def setUp(self):
        self.test_user = User.objects.create_user(
            username="TestUser", password="TestUserPassword1"
        )
        self.test_user_outsider = User.objects.create_user(
            username="TestOutsider", password="TestOutPassword1"
        )
        self.conv = Conversation.objects.create()
        self.conv.participants.add(self.test_user)
        self.message = Message.objects.create(
            author=self.test_user, conversation=self.conv, content="test message"
        )

    def test_participant_can_read_messages(self):
        self.client.force_authenticate(user=self.test_user)
        response = self.client.get(f"/api/conversations/{self.conv.id}/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["content"], self.message.content)

    def test_non_participant_cannot_read_messages(self):
        self.client.force_authenticate(user=self.test_user_outsider)
        response = self.client.get(f"/api/conversations/{self.conv.id}/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_unauthenticated_user_cannot_read_messages(self):
        response = self.client.get(f"/api/conversations/{self.conv.id}/messages/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```
`ConversationListViewTest` checks the same 3 cases for `GET /api/conversations/`.

- **`setUp`**: runs before **each** test, to create fresh data. Values are stored on `self` to use them in the tests.
- **`force_authenticate`**: logs the user in without needing a real token.
- **One test = one rule**: participant can read, outsider gets nothing, no login → 401.
- A test method must start with `test_`, otherwise Django ignores it.

Run them:
```bash
uv run manage.py test
```

### CI (`.github/workflows/ci.yml`)
**CI** (Continuous Integration): GitHub runs the tests automatically on every Pull Request to `develop` or `main`. A PR that breaks something shows a red cross before it is merged.

```yaml
name: CI

on:
  pull_request:
    branches: [develop, main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Install uv
        uses: astral-sh/setup-uv@v3
      - name: Install dependencies
        run: uv sync
      - name: Run tests
        run: uv run manage.py test
```
- `on: pull_request`: when it runs.
- `working-directory: backend`: the commands run inside `backend/`.
- Each step is a command GitHub runs on a fresh machine: get the code, install uv, install the dependencies, run the tests.

A `frontend` job (lint + build) was added later in the same file by Valentin.

---

## 8. Frontend: calling the API

`frontend/src/api/chat.js`. Every request sends the token in the header:
```javascript
import { API_URL, WS_URL } from "./config";

export async function getConversations() {
  const response = await fetch(`${API_URL}/conversations/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  });

  if (!response.ok) {
    throw await response.json();
  }
  return response.json();
}

export async function getMessages(conversationId) {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  });

  if (!response.ok) {
    throw await response.json();
  }
  return response.json();
}

export async function sendMessage(conversationId, content) {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/messages/`, {
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
  return response.json();
}
```
`API_URL` and `WS_URL` come from `api/config.js` (written by Valentin for the deployment): `http://localhost:8000/api` in development, `/api` on the server.

- A POST needs `method: "POST"`, the `Content-Type: application/json` header, and a `body` turned into a string with `JSON.stringify`.
- URLs with variables use backticks: `` `${API_URL}/...` ``.

What the API returns:
```javascript
// getConversations()
[{ id: 1, participants: [{ id: 1, username: "georgé" }, { id: 2, username: "valentin" }], created_at: "..." }]

// getMessages(1) and sendMessage(1, "...")
[{ id: 1, author: 2, author_name: "valentin", conversation: 1, created_at: "2026-09-29T18:57:18Z", content: "salut !" }]
```

**Security note**: tokens are kept in `localStorage`, which JavaScript can read. React protects against injected HTML by default (never use `dangerouslySetInnerHTML` for messages). A safer option for later: `HttpOnly` cookies.

---

## 9. Real-time messages (WebSocket)

### Why
With HTTP, the server can only answer requests. When Marie sends a message, Valentin doesn't see it until his page asks for the messages again. A **WebSocket** keeps a connection open, so the server can **push** the message to Valentin immediately.

How it works in this project:
- **Sending** a message: still the normal `POST` (already validated and secured).
- **Receiving**: through the WebSocket.
- **One connection per user** (`ws/chat/`), not one per conversation. Each user joins their own group `user_<id>`. This way, they also receive messages from conversations that aren't open.

```
Marie → POST /api/conversations/3/messages/
      → message saved in the database
      → sent to the groups "user_1" (Marie) and "user_2" (Valentin)
      → both browsers receive it instantly
```

### Installation
```bash
uv add channels daphne
```
- **Channels**: adds WebSockets to Django.
- **Daphne**: the server that runs Django in ASGI mode (replaces the normal `runserver`).

`config/settings.py`:
```python
INSTALLED_APPS = [
    "daphne",  # must be first
    ...
    "channels",
    ...
]

ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"},
}
```
- **WSGI**: one request → one response → connection closed. HTTP only.
- **ASGI**: also handles connections that stay open, like WebSockets, many at the same time.
- **Channel layer**: lets the server pass a message from one place to many connections (through groups). In-memory for development, **Redis** in production.

When `runserver` shows `Starting ASGI/Daphne ... development server`, the setup works.

### Consumer (`chat/consumers.py`)
A **consumer** is like a view, but for a WebSocket: a class whose methods are called when something happens (connection, disconnection, message).

```python
import json
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = None

        # read the token from the URL: ws/chat/?token=...
        query = parse_qs(self.scope["query_string"].decode())
        token = query.get("token", [None])[0]

        if not token:
            await self.close()
            return

        try:
            self.user_id = AccessToken(token)["user_id"]
        except TokenError:  # invalid or expired token
            await self.close()
            return

        self.group_name = f"user_{self.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))
```
- **The token is in the URL** because the browser's `WebSocket` can't send headers.
- **`self.channel_name`**: the unique address of this connection. Two open tabs = two addresses.
- **Group**: a name (`user_1`) that contains several connections. Sending to the group reaches all of them.
- **`chat_message`**: called when a message with `"type": "chat.message"` arrives in the group (the dot becomes `_`).
- **`json.dumps`**: `send` only accepts text, not a Python dict.

### Routing
`chat/routing.py` is the `urls.py` of WebSockets:
```python
from django.urls import path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    path("ws/chat/", ChatConsumer.as_asgi()),
]
```

`config/asgi.py` sends HTTP to Django and WebSockets to Channels:
```python
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django_asgi_app = get_asgi_application()  # must come before importing the routing

from channels.routing import ProtocolTypeRouter, URLRouter
from chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": URLRouter(websocket_urlpatterns),
    }
)
```
Nothing to add in `config/urls.py`: it only handles HTTP.

### Sending the message to the participants (`chat/views.py`)
At the end of `MessageListView.perform_create`, after saving:
```python
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        for participant in conversation.participants.all():
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {"type": "chat.message", "message": serializer.data},
            )
```
- **`async_to_sync`**: `group_send` is asynchronous, but DRF views are not. This adapter lets a normal view call it.
- The group name is written **the same way** as in the consumer (`user_<id>`).
- `serializer.data` is the saved message, in the same format as the GET.

### Test (browser console)
Two windows (normal + private), logged in as two users who share a conversation. In each console:
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${localStorage.getItem("access")}`);
ws.onmessage = (e) => console.log("new message:", JSON.parse(e.data));
```
Send a message from one window: it appears in both consoles.
Without a token, or with a fake one, the connection is closed.

### Key learnings
- **`self.accept()`**, not `AsyncWebsocketConsumer.accept()`: `self` is the consumer of *this* connection.
- **Events vs actions**: Channels calls `connect`, `disconnect` and `chat_message`. I call `accept`, `send` and `close`. To refuse a connection: `close()`, not `disconnect()`.
- **`AccessToken(None)` doesn't fail**, it creates a new valid token. That's why "no token" is checked first.
- **The group contains `self.channel_name`**, not the token.
- **`self.group_name = None` at the start**: `disconnect` is also called after a refused connection, and would crash otherwise.
- **`InMemoryChannelLayer`** only works with one server process. Redis is needed on the VPS.

---

## 10. Frontend: real-time chat

`frontend/src/api/chat.js`:
```javascript
export function connectChat(onMessage) {
  const ws = new WebSocket(`${WS_URL}?token=${localStorage.getItem("access")}`);

  ws.onmessage = (event) => {
    onMessage(JSON.parse(event.data));
  };

  return ws;
}
```
`WS_URL` comes from `api/config.js`: `ws://localhost:8000/ws/chat/` in development, `wss://<site>/ws/chat/` on the server.

In `ChatPage.jsx`, the connection is opened once when the page loads, and closed when leaving:
```javascript
useEffect(() => {
  const ws = connectChat((message) => {
    if (message.conversation === selectedIdRef.current) {
      setMessages((prev) => addMessage(prev, message));
    } else {
      setUnread((prev) => (prev.includes(message.conversation) ? prev : [...prev, message.conversation]));
    }
  });
  return () => ws.close();
}, []);
```
- A message for the open conversation is added to the list. A message for another conversation shows an "unread" dot.
- **No duplicates**: the sender receives their message twice (POST response + WebSocket). `addMessage` ignores a message whose `id` is already in the list.
- **The closure trap**: `onmessage` is created only once, so it would always see the *first* values of the state (`selectedId = null`, `messages = []`). Two fixes:
  - `selectedIdRef` (a `useRef`) always holds the current open conversation;
  - `setMessages((prev) => ...)` always receives the up-to-date list.

---
## 11. Backend: add a participant to a conversation

### The endpoint
`POST /api/conversations/<id>/participants/` with `{"username": "charlie"}` adds Charlie to an existing conversation (this is how a private conversation becomes a group).

Rules:
- only a **participant** of the conversation can add someone → otherwise 404
- unknown username → 404
- no `username` in the body → 400
- adding someone who is already in the conversation does nothing (no error)

### The view (`chat/views.py`)
```python
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation
from .serializers import ConversationSerializer


class AddParticipantView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation, id=conversation_id, participants=request.user
        )

        username = request.data.get("username")
        if not username:
            return Response({"username": "This field is required."}, status=400)

        user = get_object_or_404(User, username=username)
        conversation.participants.add(user.id)

        return Response(ConversationSerializer(conversation).data)
```

- **`APIView`**: the basic DRF view. It is used here because this is an *action* on an existing object, not a list or a creation, so the generic views (`ListCreateAPIView`) don't fit. One method per HTTP verb: DRF calls `post()` for a POST request.
- **`conversation_id`**: values from the URL (`<int:conversation_id>`) arrive directly as arguments of the method, with the same name. No need for `self.kwargs`.
- **`request.user`**: the logged-in user (the one making the request). In an `APIView` method, `request` is an argument, so it's `request.user`, not `self.request.user`.
- **`request.data.get("username")`**: the JSON body, already turned into a dictionary. `.get()` returns `None` if the key is missing, instead of crashing like `request.data["username"]` would.
- **`.add()`**: adds a row in the join table of the ManyToMany. It accepts an object or its id, and does nothing if the link already exists.
- **`Response(data, status=...)`**: the DRF response. Without `status`, it's 200.

### How `get_object_or_404` works
`get_object_or_404(Model, **filters)` fetches **one** object from the database, or stops the view with a **404** if it doesn't exist.

```python
conversation = get_object_or_404(
    Conversation, id=conversation_id, participants=request.user
)
```
does the same as:
```python
try:
    conversation = Conversation.objects.get(
        id=conversation_id, participants=request.user
    )
except Conversation.DoesNotExist:
    raise Http404
```

- **First argument**: the model to search in (`Conversation`, `User`...). It works with any model.
- **The other arguments**: filters, written exactly like in `.filter()` or `.get()` (`field=value`, `relation__field=value`...).
- **All filters must match at the same time** (AND). Here: the conversation with this id **and** in which the logged-in user is a participant.
- It's a **function imported from `django.shortcuts`**, not a method of `self`.
- It must find **exactly one** object. If the filters match several, Django raises an error (`MultipleObjectsReturned`), so it's meant to be used with a unique field (`id`, `username`...).

**Why the `participants=request.user` filter matters (security):**
without it, anyone who guesses a conversation id could add themselves to it and read all its messages.

**Why 404 and not 403 (forbidden):**
for someone outside the conversation, "doesn't exist" and "not yours" give the same answer. A 403 would confirm that the conversation exists, which already leaks information.

### URL (`chat/urls.py`)
```python
(
    path(
        "conversations/<int:conversation_id>/participants/",
        AddParticipantView.as_view(),
        name="add-participant",
    ),
)
```

### Testing
```bash
curl -X POST http://localhost:8000/api/conversations/1/participants/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "charlie"}'
```
- Participant + existing username → 200, the conversation with Charlie in `participants`
- Not a participant of conversation 1 → 404
- Unknown username → 404
- Empty body → 400
- No token → 401

### Key learnings
- `request.user` is **who makes the request**; the data sent by the client is in `request.data`.
- `Conversation.participants` (the class) vs `conversation.participants` (this conversation): same mistake as `AsyncWebsocketConsumer.accept()` vs `self.accept()`. Methods that act on *one* object are called on the object, not on the class.
- `get_object_or_404(User, id=username)` doesn't work: the filter must use the field that matches the value you have (`username=username`).

### Real-time notification (added to `AddParticipantView`)
After the addition, the updated conversation is sent to every participant, the new one included:
```python
        user = get_object_or_404(User, username=username)
        conversation.participants.add(user.id)

        data = ConversationSerializer(conversation).data
        channel_layer = get_channel_layer()
        for participant in conversation.participants.all():
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {"type": "conversation.updated", "conversation": data},
            )

        return Response(data)
```
- `data` is computed once: it is used for the WebSocket **and** the HTTP response.
- After `.add()`, `conversation.participants.all()` already contains the new participant, so they receive the event too.
- The group name uses the **loop variable** (`participant.id`), not the added user (`user.id`): otherwise only the new participant would receive the event, once per participant.

---

## 12. Backend: real-time conversation events

### The problem
Only messages were sent through the WebSocket. When Alice created a conversation with Bob, or added Charlie to one, the others only saw it after refreshing the page.

### The envelope
The WebSocket now carries several kinds of events, so every event is wrapped with a label telling the frontend what it receives:
```json
{"type": "message", "data": {...the message...}}
{"type": "conversation", "data": {...the conversation...}}
```

### Sending (views)
Same loop as for messages, with a different `type`:

| Where | `type` sent to the group | When |
|---|---|---|
| `MessageListView.perform_create` | `chat.message` | a message is sent |
| `ConversationListView.perform_create` | `conversation.created` | a conversation is created |
| `AddParticipantView.post` | `conversation.updated` | someone is added |

`ConversationListView.perform_create`:
```python
    def perform_create(self, serializer):
        new_list = serializer.validated_data["participants"] + [self.request.user]
        conversation = serializer.save(participants=new_list)

        channel_layer = get_channel_layer()
        for participant in conversation.participants.all():
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {"type": "conversation.created", "conversation": serializer.data},
            )
```
`serializer.save()` returns the created object, which gives access to its participants.

### Receiving (consumer)
One method per event `type` (dots become underscores), each one wraps the data in the envelope:
```python
async def chat_message(self, event):
    await self.send(text_data=json.dumps({"type": "message", "data": event["message"]}))


async def conversation_created(self, event):
    await self.send(
        text_data=json.dumps({"type": "conversation", "data": event["conversation"]})
    )


async def conversation_updated(self, event):
    await self.send(
        text_data=json.dumps({"type": "conversation", "data": event["conversation"]})
    )
```
This replaces the `chat_message` of section 9, which sent the message without an envelope.

### Two different `type`s
- The `type` of `group_send` (`"conversation.created"`) is an **address for Channels**: it says which consumer method to call. It never leaves the server.
- The `type` of the envelope (`"conversation"`) is a **label for the frontend**: it travels to the browser and tells it what to do.

`conversation.created` and `conversation.updated` both send the label `"conversation"`: for the frontend, both mean "here is the latest version of a conversation". It replaces it if it's already in the list, or adds it otherwise.

### Testing (browser console)
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${localStorage.getItem("access")}`);
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```
- send a message → `{type: "message", data: {...}}`
- create a conversation or add someone → `{type: "conversation", data: {...}}`

If a `type` has no matching method in the consumer, the server logs `No handler for message type ...`.

### Key learnings
- Changing the format of what the WebSocket sends breaks the frontend: the backend and frontend changes must be merged together.
- A typo in the envelope label (`"converstaion"`) breaks nothing on the server but the frontend silently ignores the event: very hard to find later.

---

## 13. Backend: JWT token lifetime

### The problem
Users were disconnected after 5 minutes: without settings, SimpleJWT gives the `access` token a lifetime of **5 minutes** (and 1 day for the `refresh` token).

### The fix (`config/settings.py`)
```python
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=3),
}
```
- `SIMPLE_JWT`: SimpleJWT's settings. Any missing key keeps its default value.
- `timedelta`: a **duration** (not a date). The arguments are plural: `minutes`, `hours`, `days`. `timedelta(day=3)` raises a `TypeError`.
- **access** (30 min): sent with every request, so it stays short. If it's stolen, it's only useful for a short time.
- **refresh** (3 days): only used to get a new access token. This is what decides how long a user stays logged in without typing their password again.

Tokens already given keep their old expiration date: log out and back in to test.

Check the lifetime of the current token (browser console):
```javascript
const p = JSON.parse(atob(localStorage.getItem("access").split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
console.log((p.exp - p.iat) / 60, "minutes");
```

This only delays the problem: the real fix is on the frontend, which must use the `refresh` token to get a new `access` token automatically when it expires (done by Valentin).

## Still to do
- Password strength check on registration + tests for `register`.
- Tests for the `POST` endpoints (send a message, create a conversation).
- Redis for the channel layer (production).
- PostgreSQL at deployment (SQLite in development).
- Nice to have: `GET /api/users/` for username autocompletion.

Done by Valentin in the meantime: secrets and settings read from a `.env` file (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`...), Nginx + systemd configuration for the VPS.