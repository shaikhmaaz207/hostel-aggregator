import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import User
from .models import Message


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_name = f"user_{self.user_id}"

        # Join personal room
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )

        await self.accept()
        print(f"[WS] User {self.user_id} connected to room {self.room_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )
        print(f"[WS] User {self.user_id} disconnected")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            event = data.get('event')

            if event == 'send_message':
                sender_id   = data.get('sender_id')
                receiver_id = data.get('receiver_id')
                message_text = data.get('message_text')

                if not all([sender_id, receiver_id, message_text]):
                    await self.send(text_data=json.dumps({
                        'event': 'error',
                        'message': 'sender_id, receiver_id and message_text are required'
                    }))
                    return

                # Save message to database
                message = await self.save_message(
                    sender_id, receiver_id, message_text
                )

                if message is None:
                    await self.send(text_data=json.dumps({
                        'event': 'error',
                        'message': 'Sender or receiver not found'
                    }))
                    return

                # Build message payload
                payload = {
                    'event':        'receive_message',
                    'message_id':   message.id,
                    'sender_id':    sender_id,
                    'receiver_id':  receiver_id,
                    'message_text': message_text,
                    'timestamp':    str(message.timestamp),
                }

                # Send to receiver's room
                receiver_room = f"user_{receiver_id}"
                await self.channel_layer.group_send(
                    receiver_room,
                    {
                        'type':    'chat_message',
                        'payload': payload,
                    }
                )

                # Send confirmation back to sender
                await self.send(text_data=json.dumps(payload))

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'event': 'error',
                'message': 'Invalid JSON format'
            }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['payload']))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, message_text):
        try:
            sender   = User.objects.get(id=sender_id)
            receiver = User.objects.get(id=receiver_id)
            message  = Message.objects.create(
                sender=sender,
                receiver=receiver,
                message_text=message_text
            )
            return message
        except User.DoesNotExist:
            return None
