"""
Pydantic models for request/response serialization.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class MovementType(str, Enum):
    IN = "IN"
    OUT = "OUT"
    RESERVED = "RESERVED"
    RELEASED = "RELEASED"
    ADJUSTMENT = "ADJUSTMENT"
    DAMAGED = "DAMAGED"
    EXPIRED = "EXPIRED"


class AlertType(str, Enum):
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    OVERSTOCK = "OVERSTOCK"


# Supplier schemas
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class Supplier(SupplierBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Inventory schemas
class InventoryBase(BaseModel):
    product_id: int
    current_stock: int = Field(default=0, ge=0)
    reserved_stock: int = Field(default=0, ge=0)
    min_stock_level: int = Field(default=10, ge=0)
    max_stock_level: int = Field(default=1000, ge=0)
    reorder_point: int = Field(default=20, ge=0)
    reorder_quantity: int = Field(default=100, ge=1)
    location: Optional[str] = None
    bin_location: Optional[str] = None
    cost_price: Optional[Decimal] = Field(None, gt=0)
    is_active: bool = True


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    current_stock: Optional[int] = Field(None, ge=0)
    reserved_stock: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)
    max_stock_level: Optional[int] = Field(None, ge=0)
    reorder_point: Optional[int] = Field(None, ge=0)
    reorder_quantity: Optional[int] = Field(None, ge=1)
    location: Optional[str] = None
    bin_location: Optional[str] = None
    cost_price: Optional[Decimal] = Field(None, gt=0)
    is_active: Optional[bool] = None


class StockAdjustment(BaseModel):
    adjustment: int  # Positive or negative
    notes: Optional[str] = None
    reference_id: Optional[str] = None


class StockReservation(BaseModel):
    quantity: int = Field(..., gt=0)
    reference_id: str  # Order ID or similar
    notes: Optional[str] = None


class Inventory(InventoryBase):
    id: int
    available_stock: int  # computed field
    last_restocked: Optional[datetime] = None
    last_counted: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventorySummary(BaseModel):
    """Lightweight inventory model for listings."""
    id: int
    product_id: int
    current_stock: int
    reserved_stock: int
    available_stock: int
    min_stock_level: int
    reorder_point: int
    location: Optional[str] = None

    class Config:
        from_attributes = True


# Supplier Product schemas
class SupplierProductBase(BaseModel):
    supplier_id: int
    product_id: int
    supplier_sku: Optional[str] = None
    supplier_name: Optional[str] = None
    cost_price: Decimal = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    lead_time_days: int = Field(default=7, ge=0)
    min_order_quantity: int = Field(default=1, ge=1)
    max_order_quantity: Optional[int] = Field(None, ge=1)
    package_size: int = Field(default=1, ge=1)
    is_preferred: bool = False
    is_active: bool = True


class SupplierProductCreate(SupplierProductBase):
    pass


class SupplierProductUpdate(BaseModel):
    supplier_sku: Optional[str] = None
    supplier_name: Optional[str] = None
    cost_price: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=3)
    lead_time_days: Optional[int] = Field(None, ge=0)
    min_order_quantity: Optional[int] = Field(None, ge=1)
    max_order_quantity: Optional[int] = Field(None, ge=1)
    package_size: Optional[int] = Field(None, ge=1)
    is_preferred: Optional[bool] = None
    is_active: Optional[bool] = None


class SupplierProduct(SupplierProductBase):
    id: int
    last_ordered: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional[Supplier] = None

    class Config:
        from_attributes = True


# Stock Movement schemas
class StockMovementCreate(BaseModel):
    product_id: int
    movement_type: MovementType
    quantity: int
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    cost_price: Optional[Decimal] = Field(None, gt=0)
    notes: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None
    supplier_id: Optional[int] = None


class StockMovement(BaseModel):
    id: int
    inventory_id: int
    product_id: int
    movement_type: MovementType
    quantity: int
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    cost_price: Optional[Decimal] = None
    notes: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None
    user_id: Optional[int] = None
    supplier_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Stock Alert schemas
class StockAlert(BaseModel):
    id: int
    inventory_id: int
    product_id: int
    alert_type: AlertType
    threshold_value: Optional[int] = None
    current_value: Optional[int] = None
    message: Optional[str] = None
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    is_notified: bool
    priority: str
    created_at: datetime

    class Config:
        from_attributes = True


class AlertResolve(BaseModel):
    resolved_by: Optional[int] = None
    notes: Optional[str] = None


# Purchase Order schemas
class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    supplier_product_id: Optional[int] = None
    quantity_ordered: int = Field(..., gt=0)
    unit_cost: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    expected_delivery: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]


class PurchaseOrderItem(BaseModel):
    id: int
    purchase_order_id: int
    product_id: int
    supplier_product_id: Optional[int] = None
    quantity_ordered: int
    quantity_received: int
    unit_cost: Decimal
    total_cost: Optional[Decimal] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class PurchaseOrder(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    status: str
    order_date: datetime
    expected_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    total_amount: Optional[Decimal] = None
    currency: str
    notes: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional[Supplier] = None
    items: List[PurchaseOrderItem] = []

    class Config:
        from_attributes = True


# Search and filter schemas
class InventorySearchParams(BaseModel):
    product_ids: Optional[List[int]] = None
    location: Optional[str] = None
    low_stock_only: Optional[bool] = None
    out_of_stock_only: Optional[bool] = None
    min_stock: Optional[int] = None
    max_stock: Optional[int] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=500)
    sort_by: str = Field(default="product_id")
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$")


class InventoryListResponse(BaseModel):
    items: List[InventorySummary]
    total: int
    skip: int
    limit: int


# Response schemas
class APIResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    success: bool = False


class StockLevelUpdate(BaseModel):
    new_stock: int = Field(..., ge=0)
    notes: Optional[str] = None
    cost_price: Optional[Decimal] = Field(None, gt=0)
