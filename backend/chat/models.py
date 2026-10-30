from django.db import models
from django.contrib.auth.models import User


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
