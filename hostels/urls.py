from django.urls import path
from .views import HostelListView, CreateHostelView, UploadHostelImageView, HostelImageListCreateView

urlpatterns = [
    path('', HostelListView.as_view(), name='hostel-list'),
    path('create/', CreateHostelView.as_view(), name='create-hostel'),
    path('<int:hostel_id>/upload-image/', UploadHostelImageView.as_view(), name='upload-image'),
    path('<int:hostel_id>/images/', HostelImageListCreateView.as_view(), name='hostel-images'),
]