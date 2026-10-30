from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
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
