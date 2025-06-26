"""
CRUD operations for the inventory service.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from datetime import datetime
from . import models, schemas


class InventoryCRUD:
    """CRUD operations for inventory management."""

    @staticmethod
    def get_inventory(db: Session, product_id: int) -> Optional[models.Inventory]:
        return db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()

    @staticmethod
    def get_inventory_by_id(db: Session, inventory_id: int) -> Optional[models.Inventory]:
        return db.query(models.Inventory).filter(models.Inventory.id == inventory_id).first()

    @staticmethod
    def get_inventories(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        product_ids: Optional[List[int]] = None,
        location: Optional[str] = None,
        low_stock_only: bool = False,
        out_of_stock_only: bool = False,
        min_stock: Optional[int] = None,
        max_stock: Optional[int] = None,
        sort_by: str = "product_id",
        sort_order: str = "asc"
    ) -> tuple[List[models.Inventory], int]:
        query = db.query(models.Inventory).filter(models.Inventory.is_active == True)
        
        # Apply filters
        if product_ids:
            query = query.filter(models.Inventory.product_id.in_(product_ids))
        
        if location:
            query = query.filter(models.Inventory.location.ilike(f"%{location}%"))
        
        if low_stock_only:
            query = query.filter(models.Inventory.current_stock <= models.Inventory.min_stock_level)
        
        if out_of_stock_only:
            query = query.filter(models.Inventory.current_stock <= 0)
        
        if min_stock is not None:
            query = query.filter(models.Inventory.current_stock >= min_stock)
        
        if max_stock is not None:
            query = query.filter(models.Inventory.current_stock <= max_stock)
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(models.Inventory, sort_by, models.Inventory.product_id)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Apply pagination
        items = query.offset(skip).limit(limit).all()
        
        # Update available_stock for each item
        for item in items:
            item.available_stock = max(0, item.current_stock - item.reserved_stock)
        
        return items, total

    @staticmethod
    def create_inventory(db: Session, inventory: schemas.InventoryCreate) -> models.Inventory:
        db_inventory = models.Inventory(**inventory.dict())
        db_inventory.available_stock = max(0, db_inventory.current_stock - db_inventory.reserved_stock)
        db.add(db_inventory)
        db.commit()
        db.refresh(db_inventory)
        return db_inventory

    @staticmethod
    def update_inventory(
        db: Session,
        product_id: int,
        inventory_update: schemas.InventoryUpdate
    ) -> Optional[models.Inventory]:
        db_inventory = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
        if db_inventory:
            update_data = inventory_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_inventory, field, value)
            
            # Recalculate available stock
            db_inventory.available_stock = max(0, db_inventory.current_stock - db_inventory.reserved_stock)
            db.commit()
            db.refresh(db_inventory)
        return db_inventory

    @staticmethod
    def adjust_stock(
        db: Session,
        product_id: int,
        adjustment: schemas.StockAdjustment,
        user_id: Optional[int] = None
    ) -> Optional[models.Inventory]:
        db_inventory = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
        if not db_inventory:
            return None
        
        # Apply adjustment
        new_stock = max(0, db_inventory.current_stock + adjustment.adjustment)
        old_stock = db_inventory.current_stock
        db_inventory.current_stock = new_stock
        db_inventory.available_stock = max(0, new_stock - db_inventory.reserved_stock)
        
        # Create stock movement record
        movement = models.StockMovement(
            inventory_id=db_inventory.id,
            product_id=product_id,
            movement_type=models.MovementType.ADJUSTMENT,
            quantity=adjustment.adjustment,
            reference_id=adjustment.reference_id,
            reference_type="ADJUSTMENT",
            notes=adjustment.notes,
            user_id=user_id
        )
        db.add(movement)
        
        # Check for alerts
        InventoryCRUD._check_and_create_alerts(db, db_inventory)
        
        db.commit()
        db.refresh(db_inventory)
        return db_inventory

    @staticmethod
    def reserve_stock(
        db: Session,
        product_id: int,
        reservation: schemas.StockReservation,
        user_id: Optional[int] = None
    ) -> Optional[models.Inventory]:
        db_inventory = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
        if not db_inventory:
            return None
        
        # Check if enough stock is available
        available = db_inventory.current_stock - db_inventory.reserved_stock
        if available < reservation.quantity:
            raise ValueError(f"Insufficient stock. Available: {available}, Requested: {reservation.quantity}")
        
        # Reserve stock
        db_inventory.reserved_stock += reservation.quantity
        db_inventory.available_stock = max(0, db_inventory.current_stock - db_inventory.reserved_stock)
        
        # Create stock movement record
        movement = models.StockMovement(
            inventory_id=db_inventory.id,
            product_id=product_id,
            movement_type=models.MovementType.RESERVED,
            quantity=reservation.quantity,
            reference_id=reservation.reference_id,
            reference_type="ORDER",
            notes=reservation.notes,
            user_id=user_id
        )
        db.add(movement)
        
        db.commit()
        db.refresh(db_inventory)
        return db_inventory

    @staticmethod
    def release_stock(
        db: Session,
        product_id: int,
        quantity: int,
        reference_id: str,
        user_id: Optional[int] = None
    ) -> Optional[models.Inventory]:
        db_inventory = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
        if not db_inventory:
            return None
        
        # Release reserved stock
        release_qty = min(quantity, db_inventory.reserved_stock)
        db_inventory.reserved_stock -= release_qty
        db_inventory.available_stock = max(0, db_inventory.current_stock - db_inventory.reserved_stock)
        
        # Create stock movement record
        movement = models.StockMovement(
            inventory_id=db_inventory.id,
            product_id=product_id,
            movement_type=models.MovementType.RELEASED,
            quantity=release_qty,
            reference_id=reference_id,
            reference_type="ORDER_CANCELLED",
            user_id=user_id
        )
        db.add(movement)
        
        db.commit()
        db.refresh(db_inventory)
        return db_inventory

    @staticmethod
    def _check_and_create_alerts(db: Session, inventory: models.Inventory):
        """Check stock levels and create alerts if needed."""
        current_stock = inventory.current_stock
        available_stock = inventory.available_stock
        
        # Check for existing unresolved alerts
        existing_alerts = db.query(models.StockAlert).filter(
            and_(
                models.StockAlert.inventory_id == inventory.id,
                models.StockAlert.is_resolved == False
            )
        ).all()
        
        # Resolve alerts that no longer apply
        for alert in existing_alerts:
            should_resolve = False
            if alert.alert_type == models.AlertType.OUT_OF_STOCK and current_stock > 0:
                should_resolve = True
            elif alert.alert_type == models.AlertType.LOW_STOCK and current_stock > inventory.min_stock_level:
                should_resolve = True
            
            if should_resolve:
                alert.is_resolved = True
                alert.resolved_at = datetime.utcnow()
        
        # Create new alerts if needed
        if current_stock <= 0:
            # Out of stock alert
            if not any(a.alert_type == models.AlertType.OUT_OF_STOCK and not a.is_resolved for a in existing_alerts):
                alert = models.StockAlert(
                    inventory_id=inventory.id,
                    product_id=inventory.product_id,
                    alert_type=models.AlertType.OUT_OF_STOCK,
                    threshold_value=0,
                    current_value=current_stock,
                    message=f"Product {inventory.product_id} is out of stock",
                    priority="HIGH"
                )
                db.add(alert)
        elif current_stock <= inventory.min_stock_level:
            # Low stock alert
            if not any(a.alert_type == models.AlertType.LOW_STOCK and not a.is_resolved for a in existing_alerts):
                alert = models.StockAlert(
                    inventory_id=inventory.id,
                    product_id=inventory.product_id,
                    alert_type=models.AlertType.LOW_STOCK,
                    threshold_value=inventory.min_stock_level,
                    current_value=current_stock,
                    message=f"Product {inventory.product_id} stock is below minimum level",
                    priority="MEDIUM"
                )
                db.add(alert)


class SupplierCRUD:
    """CRUD operations for suppliers."""

    @staticmethod
    def get_supplier(db: Session, supplier_id: int) -> Optional[models.Supplier]:
        return db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()

    @staticmethod
    def get_suppliers(db: Session, skip: int = 0, limit: int = 100, is_active: bool = True) -> List[models.Supplier]:
        query = db.query(models.Supplier)
        if is_active is not None:
            query = query.filter(models.Supplier.is_active == is_active)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def create_supplier(db: Session, supplier: schemas.SupplierCreate) -> models.Supplier:
        db_supplier = models.Supplier(**supplier.dict())
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        return db_supplier

    @staticmethod
    def update_supplier(
        db: Session,
        supplier_id: int,
        supplier_update: schemas.SupplierUpdate
    ) -> Optional[models.Supplier]:
        db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
        if db_supplier:
            update_data = supplier_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_supplier, field, value)
            db.commit()
            db.refresh(db_supplier)
        return db_supplier


class StockMovementCRUD:
    """CRUD operations for stock movements."""

    @staticmethod
    def get_movements(
        db: Session,
        product_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[models.StockMovement]:
        query = db.query(models.StockMovement)
        if product_id:
            query = query.filter(models.StockMovement.product_id == product_id)
        return query.order_by(desc(models.StockMovement.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def create_movement(db: Session, movement: schemas.StockMovementCreate) -> models.StockMovement:
        # Get inventory record
        inventory = db.query(models.Inventory).filter(models.Inventory.product_id == movement.product_id).first()
        if not inventory:
            raise ValueError(f"No inventory record found for product {movement.product_id}")
        
        db_movement = models.StockMovement(
            inventory_id=inventory.id,
            **movement.dict()
        )
        db.add(db_movement)
        db.commit()
        db.refresh(db_movement)
        return db_movement


class AlertCRUD:
    """CRUD operations for stock alerts."""

    @staticmethod
    def get_alerts(
        db: Session,
        is_resolved: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[models.StockAlert]:
        query = db.query(models.StockAlert)
        if is_resolved is not None:
            query = query.filter(models.StockAlert.is_resolved == is_resolved)
        return query.order_by(desc(models.StockAlert.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def resolve_alert(
        db: Session,
        alert_id: int,
        resolved_by: Optional[int] = None
    ) -> Optional[models.StockAlert]:
        alert = db.query(models.StockAlert).filter(models.StockAlert.id == alert_id).first()
        if alert:
            alert.is_resolved = True
            alert.resolved_at = datetime.utcnow()
            alert.resolved_by = resolved_by
            db.commit()
            db.refresh(alert)
        return alert
