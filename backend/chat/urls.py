from django.urls import path
from .views import (
    ConversationListView,
    MessageListView,
    AddParticipantView,
    ConversationDetailView,
)

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path(
        "conversations/<int:conversation_id>/messages/",
        MessageListView.as_view(),
        name="message-list",
    ),
    path(
        "conversations/<int:conversation_id>/participants/",
        AddParticipantView.as_view(),
        name="add-participant",
    ),
    path(
        "conversations/<int:conversation_id>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
]
