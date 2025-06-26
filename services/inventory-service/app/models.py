"""
SQLAlchemy models for the inventory service.
"""
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from .database import Base


class MovementType(PyEnum):
    """Types of stock movements."""
    IN = "IN"           # Stock received
    OUT = "OUT"         # Stock sold/shipped
    RESERVED = "RESERVED"  # Stock reserved for orders
    RELEASED = "RELEASED"  # Reserved stock released back
    ADJUSTMENT = "ADJUSTMENT"  # Manual adjustment
    DAMAGED = "DAMAGED"    # Stock marked as damaged
    EXPIRED = "EXPIRED"    # Stock expired


class AlertType(PyEnum):
    """Types of stock alerts."""
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    OVERSTOCK = "OVERSTOCK"


class Supplier(Base):
    """Supplier model for managing product suppliers."""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    tax_id = Column(String(50))
    payment_terms = Column(String(100))  # e.g., "Net 30"
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    supplier_products = relationship("SupplierProduct", back_populates="supplier")


class Inventory(Base):
    """Inventory model for tracking stock levels."""
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False, unique=True, index=True)  # FK to Product Catalog Service
    current_stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0)  # Stock reserved for pending orders
    available_stock = Column(Integer, default=0)  # current_stock - reserved_stock (computed)
    min_stock_level = Column(Integer, default=10)
    max_stock_level = Column(Integer, default=1000)
    reorder_point = Column(Integer, default=20)
    reorder_quantity = Column(Integer, default=100)
    location = Column(String(100))  # Warehouse location
    bin_location = Column(String(50))  # Specific bin/shelf location
    cost_price = Column(Numeric(10, 2))  # Average cost price
    last_restocked = Column(DateTime(timezone=True))
    last_counted = Column(DateTime(timezone=True))  # Last physical inventory count
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    movements = relationship("StockMovement", back_populates="inventory")
    alerts = relationship("StockAlert", back_populates="inventory")


class SupplierProduct(Base):
    """Many-to-many relationship between suppliers and products."""
    __tablename__ = "supplier_products"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    product_id = Column(Integer, nullable=False, index=True)  # FK to Product Catalog Service
    supplier_sku = Column(String(100))  # Supplier's SKU for this product
    supplier_name = Column(String(200))  # Supplier's name for this product
    cost_price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    lead_time_days = Column(Integer, default=7)
    min_order_quantity = Column(Integer, default=1)
    max_order_quantity = Column(Integer)
    package_size = Column(Integer, default=1)  # How many units per package
    is_preferred = Column(Boolean, default=False)  # Preferred supplier for this product
    is_active = Column(Boolean, default=True)
    last_ordered = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier", back_populates="supplier_products")


class StockMovement(Base):
    """Audit trail for all stock movements."""
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=False)
    product_id = Column(Integer, nullable=False, index=True)
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Integer, nullable=False)  # Positive for IN, negative for OUT
    reference_id = Column(String(100))  # Order ID, PO number, etc.
    reference_type = Column(String(50))  # "ORDER", "PURCHASE_ORDER", "ADJUSTMENT", etc.
    cost_price = Column(Numeric(10, 2))
    notes = Column(Text)
    batch_number = Column(String(100))
    expiry_date = Column(DateTime(timezone=True))
    user_id = Column(Integer)  # User who made the movement
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    inventory = relationship("Inventory", back_populates="movements")
    supplier = relationship("Supplier")


class StockAlert(Base):
    """Stock alerts for low stock, out of stock, etc."""
    __tablename__ = "stock_alerts"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=False)
    product_id = Column(Integer, nullable=False, index=True)
    alert_type = Column(Enum(AlertType), nullable=False)
    threshold_value = Column(Integer)  # The threshold that triggered the alert
    current_value = Column(Integer)    # The actual value when alert was triggered
    message = Column(Text)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(Integer)  # User ID who resolved
    is_notified = Column(Boolean, default=False)  # Whether notification was sent
    priority = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    inventory = relationship("Inventory", back_populates="alerts")


class PurchaseOrder(Base):
    """Purchase orders to suppliers."""
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    status = Column(String(20), default="DRAFT")  # DRAFT, SENT, CONFIRMED, SHIPPED, RECEIVED, CANCELLED
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    expected_delivery = Column(DateTime(timezone=True))
    actual_delivery = Column(DateTime(timezone=True))
    total_amount = Column(Numeric(12, 2))
    currency = Column(String(3), default="USD")
    notes = Column(Text)
    created_by = Column(Integer)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order")


class PurchaseOrderItem(Base):
    """Individual items in a purchase order."""
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(Integer, nullable=False)
    supplier_product_id = Column(Integer, ForeignKey("supplier_products.id"))
    quantity_ordered = Column(Integer, nullable=False)
    quantity_received = Column(Integer, default=0)
    unit_cost = Column(Numeric(10, 2), nullable=False)
    total_cost = Column(Numeric(12, 2))
    notes = Column(Text)

    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    supplier_product = relationship("SupplierProduct")
