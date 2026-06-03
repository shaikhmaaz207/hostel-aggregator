from django.urls import path
from .views import GetHostelsView, CreateHostelView

urlpatterns = [
    path('', GetHostelsView.as_view(), name='get-hostels'),
    path('create/', CreateHostelView.as_view(), name='create-hostel'),
]