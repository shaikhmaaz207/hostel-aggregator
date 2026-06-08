from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model  = Review
        fields = ['id', 'student_name', 'rating', 'comment', 'owner_reply', 'created_at']
        read_only_fields = ['id', 'student_name', 'owner_reply', 'created_at']