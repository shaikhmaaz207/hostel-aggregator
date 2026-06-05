from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from users.authentication import CustomJWTAuthentication
from users.models import User
from .models import Message
from .serializers import MessageSerializer
from django.db.models import Q


class MessageHistoryView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get all messages between logged in user and target user
        messages = Message.objects.filter(
            Q(sender=request.user, receiver=target_user) |
            Q(sender=target_user, receiver=request.user)
        ).order_by('timestamp')  # oldest to newest

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ConversationsView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all messages where user is sender or receiver
        messages = Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('-timestamp')

        # Build unique conversation list
        conversations = {}
        for msg in messages:
            # Get the other person in conversation
            if msg.sender == user:
                other = msg.receiver
            else:
                other = msg.sender

            # Only keep latest message per conversation
            if other.id not in conversations:
                conversations[other.id] = {
                    'user_id':      other.id,
                    'user_name':    other.name,
                    'user_role':    other.role,
                    'last_message': msg.message_text,
                    'timestamp':    msg.timestamp,
                }

        return Response(
            list(conversations.values()),
            status=status.HTTP_200_OK
        )


class SendMessageView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        message_text = request.data.get('message_text')

        if not receiver_id or not message_text:
            return Response(
                {"error": "receiver_id and message_text are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Receiver not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        msg = Message(
            sender=request.user,
            receiver=receiver,
            message_text=message_text
        )
        msg.full_clean()
        msg.save()

        serializer = MessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)