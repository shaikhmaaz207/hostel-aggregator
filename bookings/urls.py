from django.urls import path
from .views import CreateBookingView, UpdateBookingStatusView, GetBookingsView

urlpatterns = [
    path('',                       GetBookingsView.as_view(),         name='get-bookings'),
    path('create/',                CreateBookingView.as_view(),       name='create-booking'),
    path('<int:booking_id>/status/', UpdateBookingStatusView.as_view(), name='update-booking-status'),
]