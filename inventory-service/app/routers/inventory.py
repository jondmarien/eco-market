"""
Inventory API routes for stock management.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import schemas, crud, models
from ..database import get_db

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/", response_model=schemas.InventoryListResponse)
def list_inventory(
    product_ids: Optional[List[int]] = Query(None, description="Filter by product IDs"),
    location: Optional[str] = Query(None, description="Filter by location"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    out_of_stock_only: bool = Query(False, description="Show only out of stock items"),
    min_stock: Optional[int] = Query(None, ge=0, description="Minimum stock level filter"),
    max_stock: Optional[int] = Query(None, ge=0, description="Maximum stock level filter"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=500, description="Number of items to return"),
    sort_by: str = Query("product_id", description="Field to sort by"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    """List inventory items with filtering and pagination."""
    items, total = crud.InventoryCRUD.get_inventories(
        db=db,
        skip=skip,
        limit=limit,
        product_ids=product_ids,
        location=location,
        low_stock_only=low_stock_only,
        out_of_stock_only=out_of_stock_only,
        min_stock=min_stock,
        max_stock=max_stock,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return schemas.InventoryListResponse(
        items=[schemas.InventorySummary.from_orm(item) for item in items],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/low-stock", response_model=List[schemas.InventorySummary])
def get_low_stock_items(
    limit: int = Query(50, ge=1, le=500, description="Number of items to return"),
    db: Session = Depends(get_db)
):
    """Get items that are below their minimum stock level."""
    items, _ = crud.InventoryCRUD.get_inventories(
        db=db,
        limit=limit,
        low_stock_only=True,
        sort_by="current_stock",
        sort_order="asc"
    )
    return [schemas.InventorySummary.from_orm(item) for item in items]


@router.get("/out-of-stock", response_model=List[schemas.InventorySummary])
def get_out_of_stock_items(
    limit: int = Query(50, ge=1, le=500, description="Number of items to return"),
    db: Session = Depends(get_db)
):
    """Get items that are completely out of stock."""
    items, _ = crud.InventoryCRUD.get_inventories(
        db=db,
        limit=limit,
        out_of_stock_only=True,
        sort_by="last_restocked",
        sort_order="asc"
    )
    return [schemas.InventorySummary.from_orm(item) for item in items]


@router.get("/{product_id}", response_model=schemas.Inventory)
def get_inventory(product_id: int, db: Session = Depends(get_db)):
    """Get inventory details for a specific product."""
    inventory = crud.InventoryCRUD.get_inventory(db, product_id=product_id)
    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    
    # Ensure available_stock is calculated
    inventory.available_stock = max(0, inventory.current_stock - inventory.reserved_stock)
    return inventory


@router.post("/", response_model=schemas.Inventory, status_code=201)
def create_inventory(inventory: schemas.InventoryCreate, db: Session = Depends(get_db)):
    """Create a new inventory record for a product."""
    # Check if inventory already exists for this product
    existing_inventory = crud.InventoryCRUD.get_inventory(db, product_id=inventory.product_id)
    if existing_inventory:
        raise HTTPException(
            status_code=400, 
            detail=f"Inventory record already exists for product {inventory.product_id}"
        )
    
    return crud.InventoryCRUD.create_inventory(db=db, inventory=inventory)


@router.put("/{product_id}", response_model=schemas.Inventory)
def update_inventory(
    product_id: int,
    inventory_update: schemas.InventoryUpdate,
    db: Session = Depends(get_db)
):
    """Update inventory settings for a product."""
    updated_inventory = crud.InventoryCRUD.update_inventory(
        db=db, product_id=product_id, inventory_update=inventory_update
    )
    if updated_inventory is None:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return updated_inventory


@router.post("/{product_id}/adjust", response_model=schemas.Inventory)
def adjust_stock(
    product_id: int,
    adjustment: schemas.StockAdjustment,
    user_id: Optional[int] = Query(None, description="User ID making the adjustment"),
    db: Session = Depends(get_db)
):
    """Manually adjust stock levels (positive or negative adjustment)."""
    try:
        updated_inventory = crud.InventoryCRUD.adjust_stock(
            db=db, product_id=product_id, adjustment=adjustment, user_id=user_id
        )
        if updated_inventory is None:
            raise HTTPException(status_code=404, detail="Inventory record not found")
        return updated_inventory
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{product_id}/reserve", response_model=schemas.Inventory)
def reserve_stock(
    product_id: int,
    reservation: schemas.StockReservation,
    user_id: Optional[int] = Query(None, description="User ID making the reservation"),
    db: Session = Depends(get_db)
):
    """Reserve stock for an order."""
    try:
        updated_inventory = crud.InventoryCRUD.reserve_stock(
            db=db, product_id=product_id, reservation=reservation, user_id=user_id
        )
        if updated_inventory is None:
            raise HTTPException(status_code=404, detail="Inventory record not found")
        return updated_inventory
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{product_id}/release", response_model=schemas.Inventory)
def release_stock(
    product_id: int,
    quantity: int = Query(..., gt=0, description="Quantity to release"),
    reference_id: str = Query(..., description="Reference ID (e.g., order ID)"),
    user_id: Optional[int] = Query(None, description="User ID releasing the stock"),
    db: Session = Depends(get_db)
):
    """Release reserved stock back to available inventory."""
    updated_inventory = crud.InventoryCRUD.release_stock(
        db=db, 
        product_id=product_id, 
        quantity=quantity, 
        reference_id=reference_id, 
        user_id=user_id
    )
    if updated_inventory is None:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return updated_inventory


@router.put("/{product_id}/stock", response_model=schemas.Inventory)
def set_stock_level(
    product_id: int,
    stock_update: schemas.StockLevelUpdate,
    user_id: Optional[int] = Query(None, description="User ID making the update"),
    db: Session = Depends(get_db)
):
    """Set absolute stock level (usually after physical count)."""
    inventory = crud.InventoryCRUD.get_inventory(db, product_id=product_id)
    if inventory is None:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    
    # Calculate adjustment needed
    current_stock = inventory.current_stock
    adjustment_amount = stock_update.new_stock - current_stock
    
    if adjustment_amount != 0:
        adjustment = schemas.StockAdjustment(
            adjustment=adjustment_amount,
            notes=f"Stock level set to {stock_update.new_stock}. {stock_update.notes or ''}".strip(),
            reference_id="PHYSICAL_COUNT"
        )
        
        updated_inventory = crud.InventoryCRUD.adjust_stock(
            db=db, product_id=product_id, adjustment=adjustment, user_id=user_id
        )
        
        # Update cost price if provided
        if stock_update.cost_price:
            updated_inventory.cost_price = stock_update.cost_price
            db.commit()
            db.refresh(updated_inventory)
        
        return updated_inventory
    
    return inventory


@router.get("/{product_id}/movements", response_model=List[schemas.StockMovement])
def get_stock_movements(
    product_id: int,
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=500, description="Number of items to return"),
    db: Session = Depends(get_db)
):
    """Get stock movement history for a product."""
    movements = crud.StockMovementCRUD.get_movements(
        db=db, product_id=product_id, skip=skip, limit=limit
    )
    return movements


@router.get("/{product_id}/alerts", response_model=List[schemas.StockAlert])
def get_product_alerts(
    product_id: int,
    is_resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    db: Session = Depends(get_db)
):
    """Get stock alerts for a specific product."""
    query = db.query(models.StockAlert).filter(models.StockAlert.product_id == product_id)
    if is_resolved is not None:
        query = query.filter(models.StockAlert.is_resolved == is_resolved)
    
    alerts = query.order_by(models.StockAlert.created_at.desc()).all()
    return alerts
