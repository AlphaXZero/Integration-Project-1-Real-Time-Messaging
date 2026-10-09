import json
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = None

        query = parse_qs(self.scope["query_string"].decode())
        token = query.get("token", [None])[0]

        if not token:
            await self.close()
            return

        try:
            self.user_id = AccessToken(token)["user_id"]
        except TokenError:
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
