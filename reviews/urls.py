from django.urls import path
from .views import HostelReviewsView, ReviewReplyView

urlpatterns = [
    path('<int:hostel_id>/reviews/',                    HostelReviewsView.as_view(), name='hostel-reviews'),
    path('<int:hostel_id>/reviews/<int:review_id>/reply/', ReviewReplyView.as_view(),  name='review-reply'),
]