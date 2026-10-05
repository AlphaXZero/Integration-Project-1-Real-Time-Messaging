from rest_framework import serializers
from .models import Conversation, Message


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


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        # participants =
        fields = ["id", "participants", "created_at"]
