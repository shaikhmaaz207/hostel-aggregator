from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.authentication import CustomJWTAuthentication
from users.permissions import IsStudent, IsOwner
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from .serializers import BookingSerializer, BookingStatusSerializer
from chat.notifications import send_notification


class CreateBookingView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated, IsStudent]

    def post(self, request):
        hostel_id = request.data.get('hostel')
        existing  = Booking.objects.filter(
            student=request.user,
            hostel_id=hostel_id,
            status='Pending'
        ).exists()

        if existing:
            return Response(
                {"error": "You already have a pending booking for this hostel!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save(student=request.user)
            owner_id = booking.hostel.owner.id
            send_notification(
                user_id    = owner_id,
                event_type = 'new_booking',
                message    = f"New booking request from {request.user.name} for {booking.hostel.title}!",
                extra_data = {
                    'booking_id':   booking.id,
                    'student_name': request.user.name,
                    'hostel_title': booking.hostel.title,
                    'booking_date': str(booking.booking_date),
                    'status':       booking.status,
                }
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateBookingStatusView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated, IsOwner]

    def patch(self, request, booking_id):
        if request.user.role == 'Student':
            return Response(
                {"error": "Students cannot update booking status"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.hostel.owner != request.user:
            return Response(
                {"error": "You do not own this hostel"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BookingStatusSerializer(
            booking,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            updated_booking = serializer.save()
            new_status = updated_booking.status

            if new_status == 'Approved':
                send_notification(
                    user_id    = booking.student.id,
                    event_type = 'booking_approved',
                    message    = f"🎉 Your booking for {booking.hostel.title} has been APPROVED!",
                    extra_data = {
                        'booking_id':   booking.id,
                        'hostel_title': booking.hostel.title,
                        'booking_date': str(booking.booking_date),
                        'status':       new_status,
                    }
                )
            elif new_status == 'Rejected':
                send_notification(
                    user_id    = booking.student.id,
                    event_type = 'booking_rejected',
                    message    = f"❌ Your booking for {booking.hostel.title} has been REJECTED.",
                    extra_data = {
                        'booking_id':   booking.id,
                        'hostel_title': booking.hostel.title,
                        'booking_date': str(booking.booking_date),
                        'status':       new_status,
                    }
                )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetBookingsView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'Student':
            bookings = Booking.objects.filter(student=request.user)
        elif request.user.role == 'Owner':
            bookings = Booking.objects.filter(hostel__owner=request.user)
        else:
            bookings = Booking.objects.all()

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OwnerBookingRequestsView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated, IsOwner]

    def get(self, request):
        bookings = Booking.objects.filter(
            hostel__owner=request.user
        ).order_by('-created_at')

        data = []
        for booking in bookings:
            data.append({
                'id':           booking.id,
                'student_name': booking.student.name,
                'student_id':   booking.student.id,
                'hostel_title': booking.hostel.title,
                'hostel_id':    booking.hostel.id,
                'booking_date': booking.booking_date,
                'status':       booking.status,
                'created_at':   booking.created_at,
            })

        return Response(data, status=status.HTTP_200_OK)