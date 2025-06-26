"""
URL configuration for EcoMarket Analytics Service.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from analytics.apps.core.views import HealthCheckView

# Create a router for API versioning
api_router = DefaultRouter()

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # Health check
    path('health/', HealthCheckView.as_view(), name='health-check'),
    
    # API v1 routes
    path('api/v1/', include([
        path('events/', include('analytics.apps.events.urls')),
        path('reports/', include('analytics.apps.reporting.urls')),
        path('dashboards/', include('analytics.apps.dashboards.urls')),
        path('core/', include('analytics.apps.core.urls')),
    ])),
    
    # API root
    path('api/', include(api_router.urls)),
    
    # WebSocket routes (for real-time analytics)
    path('ws/', include('analytics.apps.dashboards.routing')),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Customize admin interface
admin.site.site_header = "EcoMarket Analytics Administration"
admin.site.site_title = "Analytics Admin"
admin.site.index_title = "Welcome to EcoMarket Analytics Administration"
