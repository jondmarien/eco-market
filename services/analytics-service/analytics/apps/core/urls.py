"""
URL patterns for core analytics functionality.
"""

from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('collect/', views.DataCollectionView.as_view(), name='collect-data'),
    path('metrics/overview/', views.MetricsOverviewView.as_view(), name='metrics-overview'),
]
