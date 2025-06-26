"""
Event tracking models for comprehensive analytics.
"""

from django.db import models
from django.utils import timezone
from analytics.apps.core.models import BaseModel

class UserEvent(BaseModel):
    """Track user behavior events."""
    user_id = models.CharField(max_length=100, db_index=True)
    session_id = models.CharField(max_length=100, db_index=True)
    event_type = models.CharField(max_length=50, choices=[
        ('page_view', 'Page View'),
        ('product_view', 'Product View'),
        ('search', 'Search'),
        ('add_to_cart', 'Add to Cart'),
        ('remove_from_cart', 'Remove from Cart'),
        ('checkout_start', 'Checkout Started'),
        ('checkout_complete', 'Checkout Completed'),
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('registration', 'User Registration'),
        ('profile_update', 'Profile Update'),
        ('wishlist_add', 'Add to Wishlist'),
        ('review_submit', 'Review Submitted'),
        ('newsletter_signup', 'Newsletter Signup'),
    ])
    event_data = models.JSONField(default=dict)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    
    class Meta:
        db_table = 'analytics_user_events'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user_id', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['session_id']),
        ]

class ProductEvent(BaseModel):
    """Track product-related events."""
    product_id = models.CharField(max_length=100, db_index=True)
    event_type = models.CharField(max_length=50, choices=[
        ('view', 'Product Viewed'),
        ('purchase', 'Product Purchased'),
        ('cart_add', 'Added to Cart'),
        ('cart_remove', 'Removed from Cart'),
        ('wishlist_add', 'Added to Wishlist'),
        ('review', 'Product Reviewed'),
        ('search_result', 'Appeared in Search'),
        ('recommendation_shown', 'Shown as Recommendation'),
        ('recommendation_clicked', 'Recommendation Clicked'),
    ])
    user_id = models.CharField(max_length=100, db_index=True, null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    event_data = models.JSONField(default=dict)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        db_table = 'analytics_product_events'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['product_id', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['user_id', 'product_id']),
        ]

class OrderEvent(BaseModel):
    """Track order lifecycle events."""
    order_id = models.CharField(max_length=100, db_index=True)
    user_id = models.CharField(max_length=100, db_index=True)
    event_type = models.CharField(max_length=50, choices=[
        ('created', 'Order Created'),
        ('payment_started', 'Payment Started'),
        ('payment_completed', 'Payment Completed'),
        ('payment_failed', 'Payment Failed'),
        ('confirmed', 'Order Confirmed'),
        ('shipped', 'Order Shipped'),
        ('delivered', 'Order Delivered'),
        ('cancelled', 'Order Cancelled'),
        ('refunded', 'Order Refunded'),
        ('returned', 'Order Returned'),
    ])
    order_total = models.DecimalField(max_digits=10, decimal_places=2)
    items_count = models.PositiveIntegerField()
    payment_method = models.CharField(max_length=50, blank=True)
    shipping_method = models.CharField(max_length=50, blank=True)
    event_data = models.JSONField(default=dict)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        db_table = 'analytics_order_events'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['order_id', 'timestamp']),
            models.Index(fields=['user_id', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
        ]

class SalesMetric(BaseModel):
    """Aggregated sales metrics for reporting."""
    date = models.DateField(db_index=True)
    period_type = models.CharField(max_length=20, choices=[
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ])
    
    # Sales metrics
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_orders = models.PositiveIntegerField(default=0)
    total_items_sold = models.PositiveIntegerField(default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # User metrics
    new_customers = models.PositiveIntegerField(default=0)
    returning_customers = models.PositiveIntegerField(default=0)
    total_sessions = models.PositiveIntegerField(default=0)
    
    # Product metrics
    top_products = models.JSONField(default=list)
    top_categories = models.JSONField(default=list)
    
    class Meta:
        db_table = 'analytics_sales_metrics'
        unique_together = [['date', 'period_type']]
        ordering = ['-date']
