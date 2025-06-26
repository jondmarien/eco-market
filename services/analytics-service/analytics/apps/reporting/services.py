"""
Reporting services for analytics dashboard.
"""

import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from django.core.cache import cache
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from analytics.apps.events.models import UserEvent, ProductEvent, OrderEvent, SalesMetric

logger = logging.getLogger(__name__)

class ReportingService:
    """Service for generating analytics reports and visualizations."""
    
    def get_overview_metrics(self, days=30):
        """Get high-level overview metrics for the dashboard."""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Sales metrics
        sales_metrics = self._get_sales_overview(start_date, end_date)
        
        # User metrics
        user_metrics = self._get_user_overview(start_date, end_date)
        
        # Product metrics
        product_metrics = self._get_product_overview(start_date, end_date)
        
        # Trends
        trends = self._get_trends(start_date, end_date)
        
        return {
            'sales': sales_metrics,
            'users': user_metrics,
            'products': product_metrics,
            'trends': trends,
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            }
        }
    
    def _get_sales_overview(self, start_date, end_date):
        """Get sales overview metrics."""
        # Get orders in date range
        orders = OrderEvent.objects.filter(
            event_type='payment_completed',
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        )
        
        total_revenue = orders.aggregate(Sum('order_total'))['order_total__sum'] or 0
        total_orders = orders.count()
        avg_order_value = orders.aggregate(Avg('order_total'))['order_total__avg'] or 0
        
        # Previous period comparison
        prev_start = start_date - timedelta(days=(end_date - start_date).days)
        prev_end = start_date - timedelta(days=1)
        
        prev_orders = OrderEvent.objects.filter(
            event_type='payment_completed',
            timestamp__date__gte=prev_start,
            timestamp__date__lte=prev_end
        )
        
        prev_revenue = prev_orders.aggregate(Sum('order_total'))['order_total__sum'] or 0
        revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        
        return {
            'total_revenue': float(total_revenue),
            'total_orders': total_orders,
            'average_order_value': float(avg_order_value),
            'revenue_growth_percent': round(revenue_growth, 2)
        }
    
    def _get_user_overview(self, start_date, end_date):
        """Get user overview metrics."""
        # Active users
        active_users = UserEvent.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).values('user_id').distinct().count()
        
        # New registrations
        new_users = UserEvent.objects.filter(
            event_type='registration',
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).count()
        
        # Sessions
        total_sessions = UserEvent.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).values('session_id').distinct().count()
        
        # Page views
        page_views = UserEvent.objects.filter(
            event_type='page_view',
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).count()
        
        return {
            'active_users': active_users,
            'new_users': new_users,
            'total_sessions': total_sessions,
            'page_views': page_views,
            'avg_session_duration': 0  # Placeholder for session duration calculation
        }
    
    def _get_product_overview(self, start_date, end_date):
        """Get product overview metrics."""
        # Product views
        product_views = ProductEvent.objects.filter(
            event_type='view',
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).count()
        
        # Cart additions
        cart_additions = ProductEvent.objects.filter(
            event_type='cart_add',
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).count()
        
        # Purchases
        purchases = ProductEvent.objects.filter(
            event_type='purchase',
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).count()
        
        # Conversion rate
        conversion_rate = (purchases / product_views * 100) if product_views > 0 else 0
        
        # Top products
        top_products = list(ProductEvent.objects.filter(
            event_type='view',
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).values('product_id').annotate(
            view_count=Count('id')
        ).order_by('-view_count')[:5])
        
        return {
            'product_views': product_views,
            'cart_additions': cart_additions,
            'purchases': purchases,
            'conversion_rate': round(conversion_rate, 2),
            'top_products': top_products
        }
    
    def _get_trends(self, start_date, end_date):
        """Get trend data for charts."""
        # Daily revenue trend
        daily_revenue = OrderEvent.objects.filter(
            event_type='payment_completed',
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).extra(
            select={'date': 'DATE(timestamp)'}
        ).values('date').annotate(
            revenue=Sum('order_total'),
            orders=Count('id')
        ).order_by('date')
        
        # Daily user activity
        daily_users = UserEvent.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).extra(
            select={'date': 'DATE(timestamp)'}
        ).values('date').annotate(
            active_users=Count('user_id', distinct=True),
            page_views=Count('id')
        ).order_by('date')
        
        return {
            'daily_revenue': list(daily_revenue),
            'daily_users': list(daily_users)
        }
    
    def generate_sales_report(self, start_date, end_date, format='json'):
        """Generate detailed sales report."""
        cache_key = f"sales_report_{start_date}_{end_date}_{format}"
        cached_report = cache.get(cache_key)
        
        if cached_report:
            return cached_report
        
        # Order analysis
        orders = OrderEvent.objects.filter(
            event_type='payment_completed',
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        )
        
        # Revenue by payment method
        revenue_by_payment = orders.values('payment_method').annotate(
            revenue=Sum('order_total'),
            count=Count('id')
        ).order_by('-revenue')
        
        # Revenue by day of week
        revenue_by_day = orders.extra(
            select={'day_of_week': 'EXTRACT(dow FROM timestamp)'}
        ).values('day_of_week').annotate(
            revenue=Sum('order_total'),
            count=Count('id')
        ).order_by('day_of_week')
        
        # Order size distribution
        order_size_distribution = orders.extra(
            select={
                'size_category': """
                    CASE 
                        WHEN order_total < 50 THEN 'Small (<$50)'
                        WHEN order_total < 200 THEN 'Medium ($50-$200)'
                        WHEN order_total < 500 THEN 'Large ($200-$500)'
                        ELSE 'Extra Large (>$500)'
                    END
                """
            }
        ).values('size_category').annotate(
            count=Count('id'),
            revenue=Sum('order_total')
        ).order_by('revenue')
        
        report_data = {
            'summary': {
                'total_revenue': orders.aggregate(Sum('order_total'))['order_total__sum'] or 0,
                'total_orders': orders.count(),
                'average_order_value': orders.aggregate(Avg('order_total'))['order_total__avg'] or 0,
            },
            'revenue_by_payment_method': list(revenue_by_payment),
            'revenue_by_day_of_week': list(revenue_by_day),
            'order_size_distribution': list(order_size_distribution),
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
        }
        
        # Cache for 1 hour
        cache.set(cache_key, report_data, timeout=3600)
        
        return report_data
    
    def generate_user_behavior_report(self, start_date, end_date):
        """Generate user behavior analysis report."""
        # User journey analysis
        user_events = UserEvent.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).order_by('user_id', 'timestamp')
        
        # Event type distribution
        event_distribution = UserEvent.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).values('event_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Session analysis
        session_data = UserEvent.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        ).values('session_id').annotate(
            event_count=Count('id'),
            unique_pages=Count('event_data', distinct=True),
            user_id=Count('user_id', distinct=True)
        ).order_by('-event_count')
        
        return {
            'event_distribution': list(event_distribution),
            'session_summary': {
                'total_sessions': len(session_data),
                'avg_events_per_session': sum(s['event_count'] for s in session_data) / len(session_data) if session_data else 0,
            },
            'top_sessions': list(session_data[:10])
        }
