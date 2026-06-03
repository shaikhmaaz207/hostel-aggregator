from django.db import models

class UserRole(models.TextChoices):
    STUDENT = 'Student', 'Student'
    OWNER   = 'Owner',   'Owner'
    ADMIN   = 'Admin',   'Admin'

class User(models.Model):
    name          = models.CharField(max_length=150)
    email         = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    role          = models.CharField(
                        max_length=10,
                        choices=UserRole.choices,
                        default=UserRole.STUDENT
                    )
    created_at    = models.DateTimeField(auto_now_add=True)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return f"{self.name} ({self.role})"