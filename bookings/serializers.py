from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Booking
        fields = [
            'id', 'student', 'hostel',
            'booking_date', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'student', 'status', 'created_at']


class BookingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Booking
        fields = ['id', 'status']

    def validate_status(self, value):
        allowed = ['Approved', 'Rejected', 'Cancelled']
        if value not in allowed:
            raise serializers.ValidationError(
                f"Status must be one of: {allowed}"
            )
        return value