from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_hostels, name='get_hostels'),
    path('create/', views.create_hostel, name='create_hostel'),
]
