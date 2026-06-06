from django.urls import path
from .views import HostelReviewsView

urlpatterns = [
    path('<int:hostel_id>/reviews/', HostelReviewsView.as_view(), name='hostel-reviews'),
]