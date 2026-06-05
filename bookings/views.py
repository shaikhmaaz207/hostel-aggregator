from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.authentication import CustomJWTAuthentication
from users.permissions import IsStudent, IsOwner
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from .serializers import BookingSerializer, BookingStatusSerializer


class CreateBookingView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated, IsStudent]

    def post(self, request):
        # Check if student already has pending booking for same hostel
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
            serializer.save(student=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateBookingStatusView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated, IsOwner]

    def patch(self, request, booking_id):
        # Explicitly block students
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
            serializer.save()
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