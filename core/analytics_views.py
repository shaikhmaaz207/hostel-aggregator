from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.authentication import CustomJWTAuthentication
from rest_framework.permissions import IsAuthenticated
from users.models import User
from hostels.models import Hostel
from bookings.models import Booking
from reviews.models import Review
from chat.models import Message
from django.utils import timezone
from datetime import timedelta


class PlatformAnalyticsView(APIView):
    """
    Admin-only endpoint returning platform growth stats.
    GET /api/admin/analytics
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):

        # ── BLOCK non-admin users ──
        if request.user.role != 'Admin':
            return Response(
                {"error": "Only Admin can access platform analytics"},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── USER STATS ──
        total_users    = User.objects.count()
        total_students = User.objects.filter(role='Student').count()
        total_owners   = User.objects.filter(role='Owner').count()
        total_admins   = User.objects.filter(role='Admin').count()
        verified_owners = User.objects.filter(
            role='Owner', is_verified=True
        ).count()

        # ── HOSTEL STATS ──
        total_hostels  = Hostel.objects.count()

        # ── BOOKING STATS ──
        total_bookings    = Booking.objects.count()
        pending_bookings  = Booking.objects.filter(status='Pending').count()
        approved_bookings = Booking.objects.filter(status='Approved').count()
        rejected_bookings = Booking.objects.filter(status='Rejected').count()

        # ── REVIEW STATS ──
        total_reviews = Review.objects.count()

        # ── MESSAGE STATS ──
        total_messages = Message.objects.count()

        # ── RECENT ACTIVITY (last 7 days) ──
        seven_days_ago = timezone.now() - timedelta(days=7)
        new_students_this_week = User.objects.filter(
            role='Student',
            created_at__gte=seven_days_ago
        ).count()
        new_bookings_this_week = Booking.objects.filter(
            created_at__gte=seven_days_ago
        ).count()
        new_reviews_this_week = Review.objects.filter(
            created_at__gte=seven_days_ago
        ).count()

        # ── BUILD RESPONSE ──
        analytics = {
            "platform": "HostelFinder",
            "generated_at": timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC"),

            "users": {
                "total_users":      total_users,
                "total_students":   total_students,
                "total_owners":     total_owners,
                "total_admins":     total_admins,
                "verified_owners":  verified_owners,
            },

            "hostels": {
                "total_hostels":    total_hostels,
            },

            "bookings": {
                "total_bookings":    total_bookings,
                "pending_bookings":  pending_bookings,
                "approved_bookings": approved_bookings,
                "rejected_bookings": rejected_bookings,
            },

            "reviews": {
                "total_reviews": total_reviews,
            },

            "messages": {
                "total_messages": total_messages,
            },

            "recent_activity": {
                "new_students_this_week": new_students_this_week,
                "new_bookings_this_week": new_bookings_this_week,
                "new_reviews_this_week":  new_reviews_this_week,
            },

            "health": {
                "status":   "healthy",
                "database": "connected",
                "api":      "operational"
            }
        }

        return Response(analytics, status=status.HTTP_200_OK)
