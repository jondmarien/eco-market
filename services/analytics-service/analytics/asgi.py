"""
ASGI config for EcoMarket Analytics Service.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import analytics.apps.dashboards.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'analytics.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            analytics.apps.dashboards.routing.websocket_urlpatterns
        )
    ),
})
