"""
Core models for EcoMarket Analytics Service.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class BaseModel(models.Model):
    """Base model with common fields."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class ServiceMetrics(BaseModel):
    """Track service-level metrics."""
    service_name = models.CharField(max_length=100)
    metric_name = models.CharField(max_length=100)
    metric_value = models.DecimalField(max_digits=15, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'analytics_service_metrics'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['service_name', 'metric_name']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.service_name}: {self.metric_name} = {self.metric_value}"

class DataSource(BaseModel):
    """Define data sources for analytics."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    source_type = models.CharField(max_length=50, choices=[
        ('api', 'API Endpoint'),
        ('database', 'Database'),
        ('webhook', 'Webhook'),
        ('file', 'File Upload'),
        ('stream', 'Real-time Stream'),
    ])
    endpoint_url = models.URLField(blank=True)
    authentication_config = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'analytics_data_sources'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.source_type})"
