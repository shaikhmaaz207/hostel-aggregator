from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.authentication import CustomJWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import User


class VerifyOwnerView(APIView):
    """
    Admin-only endpoint to verify or unverify an owner.
    PATCH /api/users/<user_id>/verify/
    Body: { "is_verified": true } or { "is_verified": false }
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def patch(self, request, user_id):

        # ── BLOCK non-admin users ──
        if request.user.role != 'Admin':
            return Response(
                {"error": "Only Admin can modify verification status"},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── Find the target user ──
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ── Only owners can be verified ──
        if target_user.role != 'Owner':
            return Response(
                {"error": "Only Owner accounts can be verified"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Get is_verified from request ──
        is_verified = request.data.get('is_verified')
        if is_verified is None:
            return Response(
                {"error": "is_verified field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(is_verified, bool):
            return Response(
                {"error": "is_verified must be true or false"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Update the flag ──
        target_user.is_verified = is_verified
        target_user.save()

        return Response({
            "message": f"Owner {'verified' if is_verified else 'unverified'} successfully",
            "user_id":     target_user.id,
            "name":        target_user.name,
            "role":        target_user.role,
            "is_verified": target_user.is_verified,
        }, status=status.HTTP_200_OK)


class GetOwnerVerificationView(APIView):
    """
    Get verification status of any owner.
    GET /api/users/<user_id>/verify/
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            "user_id":     target_user.id,
            "name":        target_user.name,
            "role":        target_user.role,
            "is_verified": target_user.is_verified,
        }, status=status.HTTP_200_OK)
