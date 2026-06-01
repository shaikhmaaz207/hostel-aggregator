from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Hostel
from .serializers import HostelSerializer, HostelCreateSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def get_hostels(request):
    hostels = Hostel.objects.all()
    serializer = HostelSerializer(hostels, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_hostel(request):
    if request.user.role != 'Owner':
        return Response(
            {"error": "Only hostel owners can create listings"},
            status=status.HTTP_403_FORBIDDEN
        )
    serializer = HostelCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(owner=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
