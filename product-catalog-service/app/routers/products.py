"""
Product API routes for the catalog service.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import schemas, crud, models
from ..database import get_db

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=schemas.ProductListResponse)
def list_products(
    q: str = Query(None, description="Search query"),
    category_id: int = Query(None, description="Filter by category ID"),
    min_price: float = Query(None, description="Minimum price filter"),
    max_price: float = Query(None, description="Maximum price filter"),
    brand: str = Query(None, description="Brand filter"),
    eco_rating: int = Query(None, ge=1, le=5, description="Eco rating filter (1-5)"),
    is_featured: bool = Query(None, description="Filter featured products"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    """List products with search and filtering capabilities."""
    search_params = schemas.ProductSearchParams(
        q=q,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        brand=brand,
        eco_rating=eco_rating,
        is_featured=is_featured,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    products, total = crud.ProductCRUD.search_products(db, search_params)
    
    return schemas.ProductListResponse(
        products=[schemas.ProductSummary.from_orm(p) for p in products],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/featured", response_model=List[schemas.ProductSummary])
def get_featured_products(
    limit: int = Query(10, ge=1, le=50, description="Number of featured products to return"),
    db: Session = Depends(get_db)
):
    """Get featured products."""
    products = crud.ProductCRUD.get_featured_products(db, limit=limit)
    return [schemas.ProductSummary.from_orm(p) for p in products]


@router.get("/low-stock", response_model=List[schemas.ProductSummary])
def get_low_stock_products(
    threshold: int = Query(10, ge=0, description="Stock threshold"),
    db: Session = Depends(get_db)
):
    """Get products with low stock."""
    products = crud.ProductCRUD.get_low_stock_products(db, threshold=threshold)
    return [schemas.ProductSummary.from_orm(p) for p in products]


@router.get("/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID."""
    product = crud.ProductCRUD.get_product(db, product_id=product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=schemas.Product, status_code=201)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    # Check if SKU already exists
    existing_product = crud.ProductCRUD.get_product_by_sku(db, sku=product.sku)
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    
    # Check if category exists
    category = crud.CategoryCRUD.get_category(db, category_id=product.category_id)
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
    
    return crud.ProductCRUD.create_product(db=db, product=product)


@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a product."""
    # Check if product exists
    existing_product = crud.ProductCRUD.get_product(db, product_id=product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check SKU uniqueness if being updated
    if product_update.sku and product_update.sku != existing_product.sku:
        sku_check = crud.ProductCRUD.get_product_by_sku(db, sku=product_update.sku)
        if sku_check:
            raise HTTPException(status_code=400, detail="Product with this SKU already exists")
    
    # Check if category exists if being updated
    if product_update.category_id:
        category = crud.CategoryCRUD.get_category(db, category_id=product_update.category_id)
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
    
    updated_product = crud.ProductCRUD.update_product(
        db=db, product_id=product_id, product_update=product_update
    )
    return updated_product


@router.delete("/{product_id}", response_model=schemas.APIResponse)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Soft delete a product (sets is_active to False)."""
    success = crud.ProductCRUD.delete_product(db, product_id=product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return schemas.APIResponse(message="Product deleted successfully")


@router.get("/search/suggestions")
def get_search_suggestions(
    q: str = Query(..., min_length=2, description="Search query for suggestions"),
    limit: int = Query(5, ge=1, le=20, description="Number of suggestions"),
    db: Session = Depends(get_db)
):
    """Get search suggestions based on product names and brands."""
    # This would typically use a more sophisticated search engine like Elasticsearch
    # For now, we'll do a simple database query
    search_term = f"%{q}%"
    
    # Get product name suggestions
    products = (db.query(models.Product.name)
                .filter(models.Product.name.ilike(search_term))
                .filter(models.Product.is_active == True)
                .distinct()
                .limit(limit)
                .all())
    
    # Get brand suggestions
    brands = (db.query(models.Product.brand)
              .filter(models.Product.brand.ilike(search_term))
              .filter(models.Product.is_active == True)
              .distinct()
              .limit(limit)
              .all())
    
    suggestions = [p[0] for p in products] + [b[0] for b in brands if b[0]]
    return {"suggestions": list(set(suggestions))[:limit]}
