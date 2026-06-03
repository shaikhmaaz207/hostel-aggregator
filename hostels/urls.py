from django.urls import path
from .views import GetHostelsView, CreateHostelView, UploadHostelImageView

urlpatterns = [
    path('', GetHostelsView.as_view(), name='get-hostels'),
    path('create/', CreateHostelView.as_view(), name='create-hostel'),
    path('<int:hostel_id>/upload-image/', UploadHostelImageView.as_view(), name='upload-image'),
]