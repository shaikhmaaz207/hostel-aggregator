from django.urls import path
from .views import MessageHistoryView, ConversationsView, SendMessageView

urlpatterns = [
    path('conversations/',          ConversationsView.as_view(),  name='conversations'),
    path('send/',                   SendMessageView.as_view(),    name='send-message'),
    path('history/<int:user_id>/',  MessageHistoryView.as_view(), name='message-history'),
]