from rest_framework import serializers
from .models import Hostel

class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = [
            'id',
            'title',
            'description',
            'rent_amount',
            'address',
            'latitude',
            'longitude',
            'created_at',
        ]

class HostelCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = [
            'title',
            'description',
            'rent_amount',
            'address',
            'latitude',
            'longitude',
        ]
        extra_kwargs = {
            'title': {'required': True},
            'rent_amount': {'required': True},
            'address': {'required': True},
        }
