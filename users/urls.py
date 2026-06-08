from django.urls import path
from .views import RegisterView, LoginView, GetProfileView, UpdateProfileView, GetAllUsersView
from .verification_views import VerifyOwnerView, GetOwnerVerificationView

urlpatterns = [
    path('register/',              RegisterView.as_view(),              name='register'),
    path('login/',                 LoginView.as_view(),                 name='login'),
    path('me/',                    GetProfileView.as_view(),            name='get-profile'),
    path('me/update/',             UpdateProfileView.as_view(),         name='update-profile'),
    path('users/',                 GetAllUsersView.as_view(),           name='get-all-users'),
    path('<int:user_id>/verify/',  VerifyOwnerView.as_view(),           name='verify-owner'),
    path('<int:user_id>/status/',  GetOwnerVerificationView.as_view(),  name='owner-status'),
]