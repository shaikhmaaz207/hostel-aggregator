from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Avg
from hostels.models import Hostel
from .models import Review
from .serializers import ReviewSerializer

class HostelReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, hostel_id):
        """GET /api/hostels/<id>/reviews/ — fetch all reviews for a hostel"""
        try:
            hostel = Hostel.objects.get(id=hostel_id)
        except Hostel.DoesNotExist:
            return Response({'error': 'Hostel not found'}, status=404)

        reviews = Review.objects.filter(hostel=hostel).order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)
        return Response({
            'hostel': hostel.title,
            'average_rating': hostel.average_rating,
            'total_reviews': reviews.count(),
            'reviews': serializer.data
        })

    def post(self, request, hostel_id):
        """POST /api/hostels/<id>/reviews/ — submit a review (verified students only)"""
        user = request.user

        # Only students can post reviews
        if user.role != 'Student':
            return Response({'error': 'Only students can post reviews'}, status=403)

        # Student must be verified
        if not user.is_verified:
            return Response({'error': 'Only verified students can post reviews'}, status=403)

        try:
            hostel = Hostel.objects.get(id=hostel_id)
        except Hostel.DoesNotExist:
            return Response({'error': 'Hostel not found'}, status=404)

        # Check duplicate review
        if Review.objects.filter(student=user, hostel=hostel).exists():
            return Response({'error': 'You have already reviewed this hostel'}, status=400)

        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(student=user, hostel=hostel)

            # Recalculate average rating
            avg = Review.objects.filter(hostel=hostel).aggregate(Avg('rating'))['rating__avg']
            hostel.average_rating = round(avg, 2)
            hostel.save()

            return Response({
                'message': 'Review submitted successfully',
                'review_id': review.id,
                'new_average_rating': hostel.average_rating
            }, status=201)

        return Response(serializer.errors, status=400)