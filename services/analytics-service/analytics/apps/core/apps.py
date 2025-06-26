from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'analytics.apps.core'
    verbose_name = 'Core Analytics'
