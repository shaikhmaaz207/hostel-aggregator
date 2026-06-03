from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from users.permissions import IsOwner
from users.authentication import CustomJWTAuthentication
from .models import Hostel
from .serializers import HostelSerializer
from PIL import Image
from django.core.files.base import ContentFile
import io

class GetHostelsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        hostels = Hostel.objects.all()

        # ── FILTER 1: Maximum price ──
        max_price = request.query_params.get('max_price')
        if max_price:
            try:
                hostels = hostels.filter(rent_amount__lte=float(max_price))
            except ValueError:
                return Response(
                    {"error": "max_price must be a number"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # ── FILTER 2: Minimum price ──
        min_price = request.query_params.get('min_price')
        if min_price:
            try:
                hostels = hostels.filter(rent_amount__gte=float(min_price))
            except ValueError:
                return Response(
                    {"error": "min_price must be a number"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # ── FILTER 3: Location search ──
        location = request.query_params.get('location')
        if location:
            hostels = hostels.filter(Q(address__icontains=location))

        # ── FILTER 4: General search ──
        search = request.query_params.get('search')
        if search:
            hostels = hostels.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search)
            )

        # ── SORTING ──
        sort = request.query_params.get('sort')
        if sort == 'price_asc':
            hostels = hostels.order_by('rent_amount')
        elif sort == 'price_desc':
            hostels = hostels.order_by('-rent_amount')
        else:
            hostels = hostels.order_by('-created_at')

        serializer = HostelSerializer(hostels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateHostelView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request):
        serializer = HostelSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(
            {"errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


class UploadHostelImageView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request, hostel_id):
        try:
            hostel = Hostel.objects.get(id=hostel_id, owner=request.user)
        except Hostel.DoesNotExist:
            return Response(
                {"error": "Hostel not found or you don't own it"},
                status=status.HTTP_404_NOT_FOUND
            )

        if 'image' not in request.FILES:
            return Response(
                {"error": "No image file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
