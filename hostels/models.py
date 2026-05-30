from django.db import models
from users.models import User

class Hostel(models.Model):
    owner       = models.ForeignKey(
                      User,
                      on_delete=models.CASCADE,
                      related_name='hostels'
                  )
    title       = models.CharField(max_length=200)
    description = models.TextField()
    rent_amount = models.DecimalField(max_digits=8, decimal_places=2)
    address     = models.TextField()
    latitude    = models.DecimalField(max_digits=9, decimal_places=6)
    longitude   = models.DecimalField(max_digits=9, decimal_places=6)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title