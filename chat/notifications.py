from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def send_notification(user_id, event_type, message, extra_data=None):
    """
    Reusable function to send real-time notification
    to any user's WebSocket room.

    Args:
        user_id    → The user to notify
        event_type → Type of notification (e.g. 'new_booking', 'booking_approved')
        message    → Human readable message
        extra_data → Any additional data to send
    """
    channel_layer = get_channel_layer()
    room_name = f"user_{user_id}"

    payload = {
        'type':       'chat_message',
        'payload': {
            'event':      'notification',
            'event_type': event_type,
            'message':    message,
            'data':       extra_data or {}
        }
    }

    try:
        async_to_sync(channel_layer.group_send)(room_name, payload)
        print(f"[Notification] Sent '{event_type}' to user_{user_id}")
    except Exception as e:
        print(f"[Notification] Failed to send to user_{user_id}: {e}")
