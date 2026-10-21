from rest_framework import serializers
from .models import Conversation, Message
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


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
    participants = UserSerializer(many=True, read_only=True)
    participant_usernames = serializers.SlugRelatedField(
        many=True,
        queryset=User.objects.all(),
        slug_field="username",
        write_only=True,
        source="participants",
        allow_empty=False,
    )

    class Meta:
        model = Conversation
        fields = [
            "id",
            "is_group",
            "name",
            "participants",
            "participant_usernames",
            "created_at",
        ]
        read_only_fields = ["is_group"]
