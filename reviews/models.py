from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
from hostels.models import Hostel

class Review(models.Model):
    student     = models.ForeignKey(
                      User,
                      on_delete=models.CASCADE,
                      related_name='reviews'
                  )
    hostel      = models.ForeignKey(
                      Hostel,
                      on_delete=models.CASCADE,
                      related_name='reviews'
                  )
    rating      = models.IntegerField(
                      validators=[
                          MinValueValidator(1, "Rating cannot be less than 1"),
                          MaxValueValidator(5, "Rating cannot be more than 5")
                      ]
                  )
    comment     = models.TextField(blank=True)
    owner_reply = models.TextField(blank=True, null=True)  # HA-36
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'hostel'],
                name='unique_student_hostel_review'
            )
        ]

    def __str__(self):
        return f"Review {self.id} — {self.student} → {self.hostel} ({self.rating}★)"