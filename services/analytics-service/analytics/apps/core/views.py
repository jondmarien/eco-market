"""
Core views for EcoMarket Analytics Service.
"""

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import connection
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
import requests
import logging

logger = logging.getLogger(__name__)

class HealthCheckView(APIView):
    """Health check endpoint for service monitoring."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Perform comprehensive health check."""
        health_data = {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'service': 'analytics-service',
            'version': '1.0.0',
            'checks': {}
        }
        
        # Database check
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            health_data['checks']['database'] = 'healthy'
        except Exception as e:
            health_data['checks']['database'] = f'unhealthy: {str(e)}'
            health_data['status'] = 'unhealthy'
        
        # Cache check
        try:
            cache.set('health_check', 'test', 10)
            cache.get('health_check')
            health_data['checks']['cache'] = 'healthy'
        except Exception as e:
            health_data['checks']['cache'] = f'unhealthy: {str(e)}'
            health_data['status'] = 'degraded'
        
        # External services check
        microservices_status = {}
        for service_name, service_url in settings.MICROSERVICES.items():
            try:
                response = requests.get(f"{service_url}/health", timeout=5)
                microservices_status[service_name] = 'healthy' if response.status_code == 200 else 'unhealthy'
            except Exception:
                microservices_status[service_name] = 'unavailable'
        
        health_data['checks']['microservices'] = microservices_status
        
        status_code = status.HTTP_200_OK if health_data['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(health_data, status=status_code)

class DataCollectionView(APIView):
    """Endpoint for collecting analytics data from other services."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Receive and process analytics events."""
        from analytics.apps.events.services import EventProcessingService
        
        try:
            event_data = request.data
            event_service = EventProcessingService()
            
            # Validate and process the event
            result = event_service.process_event(event_data)
            
            return Response({
                'success': True,
                'event_id': result.get('event_id'),
                'message': 'Event processed successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error processing analytics event: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class MetricsOverviewView(APIView):
    """Provide high-level metrics overview."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get overview metrics for the dashboard."""
        from analytics.apps.reporting.services import ReportingService
        
        try:
            reporting_service = ReportingService()
            
            # Get date range from query params
            days = int(request.query_params.get('days', 30))
            
            overview_data = reporting_service.get_overview_metrics(days)
            
            return Response({
                'success': True,
                'data': overview_data,
                'period_days': days
            })
            
        except Exception as e:
            logger.error(f"Error getting metrics overview: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
