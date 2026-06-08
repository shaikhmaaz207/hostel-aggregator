from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import RegisterSerializer, LoginSerializer, ProfileSerializer
from .models import User
from .authentication import get_tokens_for_user, CustomJWTAuthentication
import bcrypt

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email    = serializer.validated_data['email']
            password = serializer.validated_data['password']
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
                tokens = get_tokens_for_user(user)
                return Response(tokens)
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetProfileView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateProfileView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def put(self, request):
        serializer = ProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetAllUsersView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        # Only admin can see all users
        if request.user.role != 'Admin':
            return Response(
                {"error": "Only Admin can view all users"},
                status=status.HTTP_403_FORBIDDEN
            )

        users = User.objects.all().order_by('role', 'name')
        data  = []
        for user in users:
            data.append({
                'id':          user.id,
                'name':        user.name,
                'email':       user.email,
                'role':        user.role,
                'is_verified': user.is_verified,
                'created_at':  user.created_at,
            })

        return Response(data, status=status.HTTP_200_OK)