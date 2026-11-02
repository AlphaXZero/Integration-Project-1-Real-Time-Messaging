from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from chat.models import Conversation, Message

PASSWORD = "Canopee2026!"
USERNAMES = ["alice", "bob", "charlie", "diane", "emma"]
GROUP_NAME = "Projet Canopée"

PRIVATE_MESSAGES = [
    ("alice", "Salut Bob, tu as eu le temps de regarder la maquette ?"),
    ("bob", "Oui, elle est top. Je t'envoie mes remarques cet après-midi."),
    ("alice", "Parfait, merci !"),
]
GROUP_MESSAGES = [
    ("charlie", "Bonjour à tous ! La réunion de demain est maintenue ?"),
    ("diane", "Oui, 10h en salle 2."),
    ("alice", "Je présenterai la démo du temps réel."),
    ("emma", "Je m'occupe du compte rendu."),
]


class Command(BaseCommand):
    help = "Fill the database with demo users, a private conversation and a group."

    @transaction.atomic
    def handle(self, *args, **options):
        users = {}
        for username in USERNAMES:
            user, created = User.objects.get_or_create(username=username)
            if created:
                user.set_password(PASSWORD)
                user.save()
            users[username] = user

        alice, bob = users["alice"], users["bob"]
        private = (
            Conversation.objects.filter(is_group=False)
            .filter(participants=alice)
            .filter(participants=bob)
            .first()
        )
        if private is None:
            private = Conversation.objects.create(is_group=False)
            private.participants.add(alice, bob)

        group = Conversation.objects.filter(is_group=True, name=GROUP_NAME).first()
        if group is None:
            group = Conversation.objects.create(is_group=True, name=GROUP_NAME)
            group.participants.add(*users.values())

        # Messages are only added to an empty conversation, so running the
        # command twice doesn't duplicate them.
        for conversation, messages in [
            (private, PRIVATE_MESSAGES),
            (group, GROUP_MESSAGES),
        ]:
            if not conversation.message_set.exists():
                for author, content in messages:
                    Message.objects.create(
                        author=users[author], conversation=conversation, content=content
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data ready: {', '.join(USERNAMES)} (password: {PASSWORD})"
            )
        )
