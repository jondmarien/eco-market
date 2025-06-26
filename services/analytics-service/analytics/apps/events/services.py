"""
Event processing services for analytics.
"""

import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from django.core.cache import cache
from analytics.apps.events.models import UserEvent, ProductEvent, OrderEvent, SalesMetric
from analytics.apps.core.models import ServiceMetrics

logger = logging.getLogger(__name__)

class EventProcessingService:
    """Service for processing and storing analytics events."""
    
    def process_event(self, event_data):
        """Process incoming analytics event."""
        event_type = event_data.get('event_type')
        event_category = event_data.get('category', 'user')
        
        try:
            with transaction.atomic():
                if event_category == 'user':
                    event = self._process_user_event(event_data)
                elif event_category == 'product':
                    event = self._process_product_event(event_data)
                elif event_category == 'order':
                    event = self._process_order_event(event_data)
                else:
                    raise ValueError(f"Unknown event category: {event_category}")
                
                # Update real-time metrics
                self._update_real_time_metrics(event_category, event_type)
                
                return {'event_id': str(event.id), 'status': 'processed'}
                
        except Exception as e:
            logger.error(f"Error processing event: {str(e)}")
            raise
    
    def _process_user_event(self, event_data):
        """Process user behavior event."""
        return UserEvent.objects.create(
            user_id=event_data.get('user_id', 'anonymous'),
            session_id=event_data.get('session_id', ''),
            event_type=event_data['event_type'],
            event_data=event_data.get('data', {}),
            ip_address=event_data.get('ip_address'),
            user_agent=event_data.get('user_agent', ''),
            referrer=event_data.get('referrer', ''),
            timestamp=timezone.now()
        )
    
    def _process_product_event(self, event_data):
        """Process product-related event."""
        return ProductEvent.objects.create(
            product_id=event_data['product_id'],
            event_type=event_data['event_type'],
            user_id=event_data.get('user_id'),
            session_id=event_data.get('session_id'),
            quantity=event_data.get('quantity', 1),
            price=event_data.get('price'),
            event_data=event_data.get('data', {}),
            timestamp=timezone.now()
        )
    
    def _process_order_event(self, event_data):
        """Process order lifecycle event."""
        return OrderEvent.objects.create(
            order_id=event_data['order_id'],
            user_id=event_data['user_id'],
            event_type=event_data['event_type'],
            order_total=event_data.get('order_total', 0),
            items_count=event_data.get('items_count', 0),
            payment_method=event_data.get('payment_method', ''),
            shipping_method=event_data.get('shipping_method', ''),
            event_data=event_data.get('data', {}),
            timestamp=timezone.now()
        )
    
    def _update_real_time_metrics(self, category, event_type):
        """Update real-time metrics in cache."""
        cache_key = f"realtime_metrics_{category}_{event_type}"
        current_count = cache.get(cache_key, 0)
        cache.set(cache_key, current_count + 1, timeout=3600)  # 1 hour TTL

class AnalyticsAggregationService:
    """Service for aggregating analytics data into metrics."""
    
    def generate_daily_metrics(self, date=None):
        """Generate daily aggregated metrics."""
        if date is None:
            date = timezone.now().date()
        
        logger.info(f"Generating daily metrics for {date}")
        
        # Get sales data
        sales_data = self._calculate_sales_metrics(date)
        
        # Get user data
        user_data = self._calculate_user_metrics(date)
        
        # Get product data
        product_data = self._calculate_product_metrics(date)
        
        # Create or update sales metric record
        sales_metric, created = SalesMetric.objects.update_or_create(
            date=date,
            period_type='daily',
            defaults={
                **sales_data,
                **user_data,
                **product_data
            }
        )
        
        logger.info(f"Daily metrics {'created' if created else 'updated'} for {date}")
        return sales_metric
    
    def _calculate_sales_metrics(self, date):
        """Calculate sales metrics for a given date."""
        start_date = datetime.combine(date, datetime.min.time())
        end_date = start_date + timedelta(days=1)
        
        # Get completed orders
        completed_orders = OrderEvent.objects.filter(
            event_type='payment_completed',
            timestamp__gte=start_date,
            timestamp__lt=end_date
        )
        
        total_revenue = sum(order.order_total for order in completed_orders)
        total_orders = completed_orders.count()
        total_items = sum(order.items_count for order in completed_orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        return {
            'total_revenue': total_revenue,
            'total_orders': total_orders,
            'total_items_sold': total_items,
            'average_order_value': avg_order_value
        }
    
    def _calculate_user_metrics(self, date):
        """Calculate user metrics for a given date."""
        start_date = datetime.combine(date, datetime.min.time())
        end_date = start_date + timedelta(days=1)
        
        # New customers (first login/registration)
        new_customers = UserEvent.objects.filter(
            event_type__in=['registration', 'login'],
            timestamp__gte=start_date,
            timestamp__lt=end_date
        ).values('user_id').distinct().count()
        
        # Total sessions
        total_sessions = UserEvent.objects.filter(
            timestamp__gte=start_date,
            timestamp__lt=end_date
        ).values('session_id').distinct().count()
        
        return {
            'new_customers': new_customers,
            'total_sessions': total_sessions
        }
    
    def _calculate_product_metrics(self, date):
        """Calculate product metrics for a given date."""
        start_date = datetime.combine(date, datetime.min.time())
        end_date = start_date + timedelta(days=1)
        
        # Top products by views
        top_products = list(ProductEvent.objects.filter(
            event_type='view',
            timestamp__gte=start_date,
            timestamp__lt=end_date
        ).values('product_id').annotate(
            view_count=models.Count('id')
        ).order_by('-view_count')[:10])
        
        return {
            'top_products': top_products,
            'top_categories': []  # Placeholder for category analysis
        }
