from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 1. lire le token dans l'URL (?token=...)
        query = parse_qs(self.scope["query_string"].decode())
        token = query.get("token", [None])[0]

        # 2. pas de token → refuser
        if not token:
            await self.close()
            return

        # 3. vérifier le token et récupérer l'id de l'utilisateur
        try:
            self.user_id = AccessToken(token)["user_id"]
        except TokenError:
            await self.close()
            return

        # 4. tout est bon
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        await self.send(text_data=text_data)
