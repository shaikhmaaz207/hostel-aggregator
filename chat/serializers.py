from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name   = serializers.CharField(source='sender.name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.name', read_only=True)

    class Meta:
        model  = Message
        fields = [
            'id',
            'sender', 'sender_name',
            'receiver', 'receiver_name',
            'message_text',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']