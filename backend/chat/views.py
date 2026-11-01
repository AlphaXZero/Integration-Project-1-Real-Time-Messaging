from rest_framework import generics, permissions
from .models import Conversation, Message, User
from .serializers import ConversationSerializer, MessageSerializer
from django.shortcuts import get_object_or_404
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError


class ConversationListView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        others = [p for p in serializer.validated_data["participants"] if p != user]

        if len(others) == 0:
            raise ValidationError(
                {"participant_usernames": "Add at least one other user."}
            )

        is_group = len(others) > 1

        if not is_group:
            existing = (
                Conversation.objects.filter(is_group=False)
                .filter(participants=user)
                .filter(participants=others[0])
                .first()
            )
            if existing:
                serializer.instance = existing
                return

        conversation = serializer.save(participants=others + [user], is_group=is_group)
        channel_layer = get_channel_layer()
        for participant in conversation.participants.all():
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {"type": "conversation.created", "conversation": serializer.data},
            )


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
        if (
            conversation.participants.count() == 2
            and conversation.participants.filter(is_active=False).exists()
        ):
            raise ValidationError({"detail": "Cette personne a quitté Canopée."})
        serializer.save(author=self.request.user, conversation=conversation)

        channel_layer = get_channel_layer()
        for participant in conversation.participants.all():
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {
                    "type": "chat.message",
                    "message": serializer.data,
                },
            )


class AddParticipantView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation, id=conversation_id, participants=request.user
        )
        username = request.data.get("username")
        if not username:
            return Response({"username": "This field is required."}, status=400)

        user = get_object_or_404(User, username=username, is_active=True)

        if conversation.participants.filter(id=user.id).exists():
            return Response(ConversationSerializer(conversation).data)

        if conversation.is_group:
            conversation.participants.add(user)
            target = conversation
            event_type = "conversation.updated"
            status = 200
        else:
            target = Conversation.objects.create(is_group=True)
            target.participants.add(*conversation.participants.all(), user)
            event_type = "conversation.created"
            status = 201

        data = ConversationSerializer(target).data
        channel_layer = get_channel_layer()
        for participant in target.participants.all():
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {"type": event_type, "conversation": data},
            )

        return Response(data, status=status)
