from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from chat.models import Conversation, Message


class DeleteAccountTest(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(
            username="alice", password="AlicePassword1"
        )
        self.bob = User.objects.create_user(username="bob", password="BobPassword1")
        self.conv = Conversation.objects.create()
        self.conv.participants.add(self.alice, self.bob)
        Message.objects.create(
            author=self.bob, conversation=self.conv, content="message de bob"
        )

    def delete_bob(self, password):
        self.client.force_authenticate(user=self.bob)
        return self.client.delete("/api/me/", {"password": password}, format="json")

    def test_wrong_password_is_refused(self):
        response = self.delete_bob("mauvais")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.bob.refresh_from_db()
        self.assertTrue(self.bob.is_active)

    def test_account_is_deactivated_and_keeps_its_name(self):
        response = self.delete_bob("BobPassword1")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.bob.refresh_from_db()
        self.assertFalse(self.bob.is_active)
        self.assertEqual(self.bob.username, "bob")
        self.assertEqual(Message.objects.filter(author=self.bob).count(), 1)

    def test_deleted_user_cannot_log_in(self):
        self.delete_bob("BobPassword1")
        response = self.client.post(
            "/api/token/",
            {"username": "bob", "password": "BobPassword1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_write_to_a_deleted_user(self):
        self.delete_bob("BobPassword1")
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(
            f"/api/conversations/{self.conv.id}/messages/",
            {"content": "allo ?"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RegisterTest(APITestCase):
    url = "/api/register/"

    def test_register_creates_an_account(self):
        response = self.client.post(
            self.url, {"username": "alice", "password": "AlicePassword1"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # The password is never sent back.
        self.assertNotIn("password", response.data)
        alice = User.objects.get(username="alice")
        # It is stored hashed, not in plain text.
        self.assertNotEqual(alice.password, "AlicePassword1")
        self.assertTrue(alice.check_password("AlicePassword1"))

    def test_new_account_can_log_in(self):
        self.client.post(
            self.url, {"username": "alice", "password": "AlicePassword1"}, format="json"
        )
        response = self.client.post(
            "/api/token/",
            {"username": "alice", "password": "AlicePassword1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_username_already_taken_is_refused(self):
        User.objects.create_user(username="alice", password="AlicePassword1")
        response = self.client.post(
            self.url, {"username": "alice", "password": "OtherPassword1"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertEqual(User.objects.filter(username="alice").count(), 1)

    def test_missing_password_is_refused(self):
        response = self.client.post(self.url, {"username": "alice"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="alice").exists())
