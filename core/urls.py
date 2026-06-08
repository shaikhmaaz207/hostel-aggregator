from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static
from core.analytics_views import PlatformAnalyticsView
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',             include('users.urls')),
    path('api/hostels/',          include('hostels.urls')),
    path('api/hostels/',          include('reviews.urls')),
    path('api/bookings/',         include('bookings.urls')),
    path('api/messages/',         include('chat.urls')),
    path('api/admin/analytics',   PlatformAnalyticsView.as_view(), name='platform-analytics'),
    re_path(r'^frontend/(?P<path>.*)$', serve, {
        'document_root': os.path.join(settings.BASE_DIR, 'frontend'),
    }),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
