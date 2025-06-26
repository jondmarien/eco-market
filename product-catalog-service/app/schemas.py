"""
Pydantic models for request/response serialization.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


# Base schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None


class Category(CategoryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Product schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    sku: str = Field(..., min_length=1, max_length=50)
    stock_quantity: int = Field(default=0, ge=0)
    category_id: int
    image_url: Optional[str] = None
    tags: List[str] = []
    is_active: bool = True
    is_featured: bool = False
    weight: Optional[Decimal] = Field(None, gt=0)
    dimensions: Optional[str] = None
    brand: Optional[str] = None
    eco_rating: Optional[int] = Field(None, ge=1, le=5)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    stock_quantity: Optional[int] = Field(None, ge=0)
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    weight: Optional[Decimal] = Field(None, gt=0)
    dimensions: Optional[str] = None
    brand: Optional[str] = None
    eco_rating: Optional[int] = Field(None, ge=1, le=5)


class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[Category] = None

    class Config:
        from_attributes = True


class ProductSummary(BaseModel):
    """Lightweight product model for listings."""
    id: int
    name: str
    price: Decimal
    sku: str
    stock_quantity: int
    image_url: Optional[str] = None
    is_featured: bool
    eco_rating: Optional[int] = None

    class Config:
        from_attributes = True


# Search and filter schemas
class ProductSearchParams(BaseModel):
    q: Optional[str] = None  # Search query
    category_id: Optional[int] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    brand: Optional[str] = None
    eco_rating: Optional[int] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class ProductListResponse(BaseModel):
    products: List[ProductSummary]
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
