from rest_framework import serializers
from .models import User
import bcrypt

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        validated_data['password_hash'] = hashed.decode('utf-8')
        return User.objects.create(**validated_data)


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'id', 'name', 'email', 'role',
            'phone_number', 'profile_picture', 'college_name',
            'created_at'
        ]
        # Block modifications to these fields
        read_only_fields = ['id', 'email', 'role', 'created_at']