from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Avg
from hostels.models import Hostel
from users.authentication import CustomJWTAuthentication
from .models import Review
from .serializers import ReviewSerializer
from rest_framework import status

class HostelReviewsView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request, hostel_id):
        try:
            hostel = Hostel.objects.get(id=hostel_id)
        except Hostel.DoesNotExist:
            return Response({'error': 'Hostel not found'}, status=404)

        reviews = Review.objects.filter(hostel=hostel).order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)
        return Response({
            'hostel':          hostel.title,
            'average_rating':  hostel.average_rating,
            'total_reviews':   reviews.count(),
            'reviews':         serializer.data
        })

    def post(self, request, hostel_id):
        user = request.user

        if user.role != 'Student':
            return Response(
                {'error': 'Only students can post reviews'},
                status=403
            )

        if not user.is_verified:
            return Response(
                {'error': 'Only verified students can post reviews'},
                status=403
            )

        try:
            hostel = Hostel.objects.get(id=hostel_id)
        except Hostel.DoesNotExist:
            return Response({'error': 'Hostel not found'}, status=404)

        if Review.objects.filter(student=user, hostel=hostel).exists():
            return Response(
                {'error': 'You have already reviewed this hostel'},
                status=400
            )

        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(student=user, hostel=hostel)
            avg = Review.objects.filter(
                hostel=hostel
            ).aggregate(Avg('rating'))['rating__avg']
            hostel.average_rating = round(avg, 2)
            hostel.save()
            return Response({
                'message':            'Review submitted successfully',
                'review_id':          review.id,
                'new_average_rating': hostel.average_rating
            }, status=201)
        return Response(serializer.errors, status=400)
    
class ReviewReplyView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request, hostel_id, review_id):
        user = request.user

        # Only owners can reply
        if user.role != 'Owner':
            return Response(
                {'error': 'Only hostel owners can reply to reviews'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            hostel = Hostel.objects.get(id=hostel_id, owner=user)
        except Hostel.DoesNotExist:
            return Response(
                {'error': 'Hostel not found or you do not own it'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            review = Review.objects.get(id=review_id, hostel=hostel)
        except Review.DoesNotExist:
            return Response(
                {'error': 'Review not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if review.owner_reply:
            return Response(
                {'error': 'You have already replied to this review'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reply_text = request.data.get('reply', '').strip()
        if len(reply_text) < 5:
            return Response(
                {'error': 'Reply must be at least 5 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        review.owner_reply = reply_text
        review.save()

        return Response({
            'message':     'Reply posted successfully',
            'review_id':   review.id,
            'owner_reply': review.owner_reply
        }, status=status.HTTP_201_CREATED)