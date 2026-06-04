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
from .models import HostelImage   # add this import at the top if not already there

class HostelImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HostelImage
        fields = ['id', 'hostel', 'image_url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']
