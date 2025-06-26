"""
SQLAlchemy models for the product catalog service.
"""
import uuid
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Category(Base):
    """Category model for organizing products."""
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    parent = relationship("Category", remote_side=[id])
    children = relationship("Category")
    products = relationship("Product", back_populates="category")


class Product(Base):
    """Product model for the catalog."""
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    stock_quantity = Column(Integer, default=0)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    image_url = Column(String(500))
    tags = Column(ARRAY(String), default=[])
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    weight = Column(Numeric(10, 3))  # in kg
    dimensions = Column(String(100))  # e.g., "10x20x30 cm"
    brand = Column(String(100))
    eco_rating = Column(Integer)  # 1-5 sustainability rating
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("Category", back_populates="products")


class ProductVariant(Base):
    """Product variants for different options (color, size, etc.)."""
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g., "Red - Large"
    sku = Column(String(50), unique=True, nullable=False)
    price = Column(Numeric(10, 2))  # Override product price if different
    stock_quantity = Column(Integer, default=0)
    attributes = Column(Text)  # JSON string for flexible attributes
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product")
