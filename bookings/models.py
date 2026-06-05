from django.db import models
from users.models import User
from hostels.models import Hostel

class BookingStatus(models.TextChoices):
    PENDING   = 'Pending',   'Pending'
    APPROVED  = 'Approved',  'Approved'
    REJECTED  = 'Rejected',  'Rejected'
    CANCELLED = 'Cancelled', 'Cancelled'

class Booking(models.Model):
    student      = models.ForeignKey(
                       User,
                       on_delete=models.CASCADE,
                       related_name='bookings'
                   )
    hostel       = models.ForeignKey(
                       Hostel,
                       on_delete=models.CASCADE,
                       related_name='bookings'
                   )
    booking_date = models.DateField()
    status       = models.CharField(
                       max_length=10,
                       choices=BookingStatus.choices,
                       default=BookingStatus.PENDING
                   )
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookings'

    def __str__(self):
        return f"Booking {self.id} — {self.student} → {self.hostel} ({self.status})"