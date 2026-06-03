# hostels/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Hostel
from .serializers import HostelSerializer
from .validators import validate_search_params     # ← NEW import


class HostelListView(APIView):
    """
    GET /api/hostels/

    Accepted query parameters:
        max_price   → positive number   e.g. ?max_price=5000
        room_type   → single/double/triple/quadruple
        location    → text string       e.g. ?location=Aurangabad
        sort        → price_asc / price_desc
    """
    permission_classes = [AllowAny]

    def get(self, request):

        # ── STEP 1: Run validation BEFORE touching the database ──
        result = validate_search_params(request.query_params)

        # If validator found any errors, return 400 immediately
        if 'errors' in result:
            return Response(
                {
                    "error": "Invalid query parameters.",
                    "details": result['errors']
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # All params are clean — use the sanitized values
        cleaned = result.get('cleaned', {})

        # ── STEP 2: Start with all hostels ──
        queryset = Hostel.objects.all()

        # ── STEP 3: Apply filters using cleaned values ──
        if 'max_price' in cleaned:
            queryset = queryset.filter(rent_amount__lte=cleaned['max_price'])

        if 'room_type' in cleaned:
            queryset = queryset.filter(
                rooms__room_type__icontains=cleaned['room_type']
            ).distinct()

        if 'location' in cleaned:
            queryset = queryset.filter(
                address__icontains=cleaned['location']
            )

        # ── STEP 4: Apply sorting ──
        if cleaned.get('sort') == 'price_asc':
            queryset = queryset.order_by('rent_amount')
        elif cleaned.get('sort') == 'price_desc':
            queryset = queryset.order_by('-rent_amount')
        else:
            queryset = queryset.order_by('-created_at')

        # ── STEP 5: Serialize and return ──
        serializer = HostelSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
