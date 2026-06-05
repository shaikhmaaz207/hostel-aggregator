from django.db import models
from django.core.validators import MinLengthValidator
from users.models import User

class Message(models.Model):
    sender       = models.ForeignKey(
                       User,
                       on_delete=models.CASCADE,
                       related_name='sent_messages'
                   )
    receiver     = models.ForeignKey(
                       User,
                       on_delete=models.CASCADE,
                       related_name='received_messages'
                   )
    message_text = models.TextField(
                       blank=False,
                       null=False,
                       validators=[MinLengthValidator(1, "Message cannot be empty")]
                   )
    timestamp    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        indexes  = [
            models.Index(
                fields=['sender', 'receiver'],
                name='sender_receiver_idx'
            )
        ]

    def __str__(self):
        return f"Message {self.id} — {self.sender} → {self.receiver}"