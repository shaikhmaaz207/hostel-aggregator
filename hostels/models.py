from django.db import models
from users.models import User

class Hostel(models.Model):
    owner       = models.ForeignKey(
                      User,
                      on_delete=models.CASCADE,
                      related_name='hostels',
                      null=True, blank=True
                  )
    title       = models.CharField(max_length=200)
    description = models.TextField()
    rent_amount = models.DecimalField(max_digits=8, decimal_places=2)
    address     = models.TextField()
    latitude    = models.DecimalField(max_digits=9, decimal_places=6)
    longitude   = models.DecimalField(max_digits=9, decimal_places=6)
    image       = models.ImageField(upload_to='hostels/', blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)  # HA-29

    def __str__(self):
        return self.title


class HostelImage(models.Model):
    id         = models.AutoField(primary_key=True)
    hostel     = models.ForeignKey(
                     'Hostel',
                     on_delete=models.CASCADE,
                     related_name='images'
                 )
    image_url  = models.URLField(max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hostel_images'

    def __str__(self):
        return f"Image {self.id} → Hostel {self.hostel_id}"