# hostels/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.permissions import IsOwner
from users.authentication import CustomJWTAuthentication
from .models import Hostel
from .serializers import HostelSerializer
from .validators import validate_search_params
from PIL import Image
from django.core.files.base import ContentFile
import io

class HostelListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        result = validate_search_params(request.query_params)
        if 'errors' in result:
            return Response(
                {
                    "error": "Invalid query parameters.",
                    "details": result['errors']
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        cleaned = result.get('cleaned', {})
        queryset = Hostel.objects.all()

        if 'max_price' in cleaned:
            queryset = queryset.filter(rent_amount__lte=cleaned['max_price'])
        if 'room_type' in cleaned:
            queryset = queryset.filter(
                rooms__room_type__icontains=cleaned['room_type']
            ).distinct()
        if 'location' in cleaned:
            queryset = queryset.filter(address__icontains=cleaned['location'])

        if cleaned.get('sort') == 'price_asc':
            queryset = queryset.order_by('rent_amount')
        elif cleaned.get('sort') == 'price_desc':
            queryset = queryset.order_by('-rent_amount')
        else:
            queryset = queryset.order_by('-created_at')

        serializer = HostelSerializer(queryset, many=True)
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

        image_file = request.FILES['image']
        img = Image.open(image_file)

        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        max_size = (800, 600)
        img.thumbnail(max_size, Image.LANCZOS)

        output = io.BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)

        filename = f"hostel_{hostel_id}_{image_file.name}"
        hostel.image.save(filename, ContentFile(output.read()), save=True)

        return Response({
            "message": "Image uploaded successfully",
            "image_url": request.build_absolute_uri(hostel.image.url)
        }, status=status.HTTP_200_OK)
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import HostelImage
from .serializers import HostelImageSerializer

class HostelImageListCreateView(generics.ListCreateAPIView):
    serializer_class   = HostelImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        hostel_id = self.kwargs['hostel_id']
        return HostelImage.objects.filter(hostel_id=hostel_id)

    def perform_create(self, serializer):
        hostel_id = self.kwargs['hostel_id']
        serializer.save(hostel_id=hostel_id)
