from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from .consumers import ChatConsumer
from .models import Conversation, Message


class ConversationListViewTest(APITestCase):
    def setUp(self):
        self.test_user = User.objects.create_user(
            username="TestUser", password="TestUserPassword1"
        )
        self.test_user_outsider = User.objects.create_user(
            username="TestOutsider", password="TestOutPassword1"
        )
        self.conv = Conversation.objects.create()
        self.conv.participants.add(self.test_user)

    def test_participant_sees_their_conversation(self):
        self.client.force_authenticate(user=self.test_user)
        response = self.client.get("/api/conversations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_non_participant_does_not_see_conversation(self):
        self.client.force_authenticate(user=self.test_user_outsider)
        response = self.client.get("/api/conversations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_unauthenticated_user_cannot_list_conversations(self):
        response = self.client.get("/api/conversations/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


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


class SendMessageTest(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="Password1")
        self.bob = User.objects.create_user(username="bob", password="Password1")
        self.charlie = User.objects.create_user(
            username="charlie", password="Password1"
        )
        self.conv = Conversation.objects.create()
        self.conv.participants.add(self.alice, self.bob)
        self.url = f"/api/conversations/{self.conv.id}/messages/"

    def test_participant_can_send_a_message(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(self.url, {"content": "Bonjour"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["author_name"], "alice")
        # The author comes from the token, not from the request.
        message = Message.objects.get(conversation=self.conv)
        self.assertEqual(message.author, self.alice)
        self.assertEqual(message.content, "Bonjour")

    def test_author_cannot_be_forged(self):
        self.client.force_authenticate(user=self.alice)
        self.client.post(
            self.url, {"content": "Bonjour", "author": self.bob.id}, format="json"
        )
        self.assertEqual(Message.objects.get(conversation=self.conv).author, self.alice)

    def test_empty_message_is_refused(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(self.url, {"content": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Message.objects.exists())

    def test_non_participant_cannot_send_a_message(self):
        self.client.force_authenticate(user=self.charlie)
        response = self.client.post(self.url, {"content": "Coucou"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(Message.objects.exists())

    def test_unauthenticated_user_cannot_send_a_message(self):
        response = self.client.post(self.url, {"content": "Coucou"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Message.objects.exists())


class CreateConversationTest(APITestCase):
    url = "/api/conversations/"

    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="Password1")
        self.bob = User.objects.create_user(username="bob", password="Password1")
        self.charlie = User.objects.create_user(
            username="charlie", password="Password1"
        )
        self.client.force_authenticate(user=self.alice)

    def create(self, usernames):
        return self.client.post(
            self.url, {"participant_usernames": usernames}, format="json"
        )

    def test_create_a_private_conversation(self):
        response = self.create(["bob"])
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data["is_group"])
        conversation = Conversation.objects.get(id=response.data["id"])
        self.assertEqual(set(conversation.participants.all()), {self.alice, self.bob})

    def test_same_private_conversation_is_not_duplicated(self):
        first = self.create(["bob"])
        second = self.create(["bob"])
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(Conversation.objects.count(), 1)

    def test_create_a_group(self):
        response = self.create(["bob", "charlie"])
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_group"])
        self.assertEqual(len(response.data["participants"]), 3)

    def test_two_groups_with_the_same_people_are_allowed(self):
        self.create(["bob", "charlie"])
        self.create(["bob", "charlie"])
        self.assertEqual(Conversation.objects.filter(is_group=True).count(), 2)

    def test_client_cannot_choose_the_type(self):
        response = self.client.post(
            self.url,
            {"participant_usernames": ["bob", "charlie"], "is_group": False},
            format="json",
        )
        self.assertTrue(response.data["is_group"])

    def test_conversation_with_only_myself_is_refused(self):
        response = self.create(["alice"])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Conversation.objects.count(), 0)

    def test_empty_list_is_refused(self):
        response = self.create([])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_username_is_refused(self):
        response = self.create(["nobody"])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Conversation.objects.count(), 0)

    def test_deleted_account_is_refused(self):
        self.bob.is_active = False
        self.bob.save()
        response = self.create(["bob"])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_user_cannot_create(self):
        self.client.force_authenticate(user=None)
        response = self.create(["bob"])
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AddParticipantTest(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="Password1")
        self.bob = User.objects.create_user(username="bob", password="Password1")
        self.charlie = User.objects.create_user(
            username="charlie", password="Password1"
        )
        self.dave = User.objects.create_user(username="dave", password="Password1")

        self.private = Conversation.objects.create(is_group=False)
        self.private.participants.add(self.alice, self.bob)
        Message.objects.create(
            author=self.bob, conversation=self.private, content="secret"
        )
        self.group = Conversation.objects.create(is_group=True, name="Projet")
        self.group.participants.add(self.alice, self.bob, self.charlie)
        self.client.force_authenticate(user=self.alice)

    def add(self, conversation, username):
        return self.client.post(
            f"/api/conversations/{conversation.id}/participants/",
            {"username": username},
            format="json",
        )

    def test_add_to_a_group(self):
        response = self.add(self.group, "dave")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.group.id)
        self.assertTrue(self.group.participants.filter(id=self.dave.id).exists())

    def test_add_to_a_private_conversation_creates_a_new_group(self):
        response = self.add(self.private, "charlie")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_group = Conversation.objects.get(id=response.data["id"])
        self.assertNotEqual(new_group.id, self.private.id)
        self.assertTrue(new_group.is_group)
        self.assertEqual(
            set(new_group.participants.all()), {self.alice, self.bob, self.charlie}
        )
        # The private conversation and its history are unchanged.
        self.assertEqual(self.private.participants.count(), 2)
        self.assertFalse(Message.objects.filter(conversation=new_group).exists())

    def test_adding_someone_already_there_changes_nothing(self):
        response = self.add(self.private, "bob")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.private.id)
        self.assertEqual(Conversation.objects.count(), 2)

    def test_unknown_user_returns_404(self):
        response = self.add(self.group, "nobody")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_missing_username_returns_400(self):
        response = self.client.post(
            f"/api/conversations/{self.group.id}/participants/", {}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deleted_account_cannot_be_added(self):
        self.dave.is_active = False
        self.dave.save()
        response = self.add(self.group, "dave")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.group.participants.count(), 3)

    def test_non_participant_cannot_add_someone(self):
        self.client.force_authenticate(user=self.dave)
        response = self.add(self.private, "dave")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.private.participants.count(), 2)


class RenameGroupTest(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="Password1")
        self.bob = User.objects.create_user(username="bob", password="Password1")
        self.charlie = User.objects.create_user(
            username="charlie", password="Password1"
        )
        self.dave = User.objects.create_user(username="dave", password="Password1")
        self.group = Conversation.objects.create(is_group=True)
        self.group.participants.add(self.alice, self.bob, self.charlie)
        self.private = Conversation.objects.create(is_group=False)
        self.private.participants.add(self.alice, self.bob)
        self.client.force_authenticate(user=self.alice)

    def rename(self, conversation, name):
        return self.client.patch(
            f"/api/conversations/{conversation.id}/", {"name": name}, format="json"
        )

    def test_rename_a_group(self):
        response = self.rename(self.group, "  Projet Canopée  ")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.group.refresh_from_db()
        self.assertEqual(self.group.name, "Projet Canopée")

    def test_empty_name_removes_the_name(self):
        self.group.name = "Ancien nom"
        self.group.save()
        response = self.rename(self.group, "")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.group.refresh_from_db()
        self.assertEqual(self.group.name, "")

    def test_private_conversation_cannot_be_renamed(self):
        response = self.rename(self.private, "Nom")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.private.refresh_from_db()
        self.assertEqual(self.private.name, "")

    def test_name_longer_than_100_characters_is_refused(self):
        response = self.rename(self.group, "a" * 101)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_participant_cannot_rename(self):
        self.client.force_authenticate(user=self.dave)
        response = self.rename(self.group, "Piraté")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.group.refresh_from_db()
        self.assertEqual(self.group.name, "")


class ChatConsumerTest(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="Password1")
        self.bob = User.objects.create_user(username="bob", password="Password1")
        self.conv = Conversation.objects.create()
        self.conv.participants.add(self.alice, self.bob)

    def communicator(self, query=""):
        return WebsocketCommunicator(ChatConsumer.as_asgi(), f"/ws/chat/{query}")

    async def test_connection_without_token_is_refused(self):
        connected, _ = await self.communicator().connect()
        self.assertFalse(connected)

    async def test_connection_with_an_invalid_token_is_refused(self):
        connected, _ = await self.communicator("?token=abc").connect()
        self.assertFalse(connected)

    async def test_participant_receives_a_message_in_real_time(self):
        token = str(AccessToken.for_user(self.bob))
        bob_socket = self.communicator(f"?token={token}")
        connected, _ = await bob_socket.connect()
        self.assertTrue(connected)

        # Alice sends a message through the REST API, like the frontend does.
        client = APIClient()
        client.force_authenticate(user=self.alice)
        response = await sync_to_async(client.post)(
            f"/api/conversations/{self.conv.id}/messages/",
            {"content": "Salut Bob"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        event = await bob_socket.receive_json_from(timeout=2)
        self.assertEqual(event["type"], "message")
        self.assertEqual(event["data"]["content"], "Salut Bob")
        self.assertEqual(event["data"]["author_name"], "alice")
        await bob_socket.disconnect()

    async def test_user_only_receives_events_of_their_own_group(self):
        token = str(AccessToken.for_user(self.bob))
        bob_socket = self.communicator(f"?token={token}")
        await bob_socket.connect()
        await get_channel_layer().group_send(
            f"user_{self.alice.id}",
            {"type": "chat.message", "message": {"content": "pour alice"}},
        )
        self.assertTrue(await bob_socket.receive_nothing(timeout=0.5))
        await bob_socket.disconnect()
