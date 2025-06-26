"""
CRUD operations for the product catalog service.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from . import models, schemas


class CategoryCRUD:
    """CRUD operations for categories."""

    @staticmethod
    def get_category(db: Session, category_id: int) -> Optional[models.Category]:
        return db.query(models.Category).filter(models.Category.id == category_id).first()

    @staticmethod
    def get_categories(db: Session, skip: int = 0, limit: int = 100) -> List[models.Category]:
        return db.query(models.Category).filter(models.Category.is_active == True).offset(skip).limit(limit).all()

    @staticmethod
    def create_category(db: Session, category: schemas.CategoryCreate) -> models.Category:
        db_category = models.Category(**category.dict())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category

    @staticmethod
    def update_category(db: Session, category_id: int, category_update: schemas.CategoryUpdate) -> Optional[models.Category]:
        db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
        if db_category:
            update_data = category_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_category, field, value)
            db.commit()
            db.refresh(db_category)
        return db_category

    @staticmethod
    def delete_category(db: Session, category_id: int) -> bool:
        db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
        if db_category:
            db_category.is_active = False
            db.commit()
            return True
        return False


class ProductCRUD:
    """CRUD operations for products."""

    @staticmethod
    def get_product(db: Session, product_id: int) -> Optional[models.Product]:
        return db.query(models.Product).filter(models.Product.id == product_id).first()

    @staticmethod
    def get_product_by_sku(db: Session, sku: str) -> Optional[models.Product]:
        return db.query(models.Product).filter(models.Product.sku == sku).first()

    @staticmethod
    def get_products(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        is_active: bool = True
    ) -> List[models.Product]:
        query = db.query(models.Product).filter(models.Product.is_active == is_active)
        
        if category_id:
            query = query.filter(models.Product.category_id == category_id)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def search_products(
        db: Session,
        search_params: schemas.ProductSearchParams
    ) -> tuple[List[models.Product], int]:
        """Search products with filters and return results with total count."""
        query = db.query(models.Product).filter(models.Product.is_active == True)
        
        # Text search
        if search_params.q:
            search_term = f"%{search_params.q}%"
            query = query.filter(
                or_(
                    models.Product.name.ilike(search_term),
                    models.Product.description.ilike(search_term),
                    models.Product.brand.ilike(search_term),
                    models.Product.tags.op('@>')([search_params.q])
                )
            )
        
        # Category filter
        if search_params.category_id:
            query = query.filter(models.Product.category_id == search_params.category_id)
        
        # Price range filters
        if search_params.min_price:
            query = query.filter(models.Product.price >= search_params.min_price)
        if search_params.max_price:
            query = query.filter(models.Product.price <= search_params.max_price)
        
        # Brand filter
        if search_params.brand:
            query = query.filter(models.Product.brand.ilike(f"%{search_params.brand}%"))
        
        # Eco rating filter
        if search_params.eco_rating:
            query = query.filter(models.Product.eco_rating == search_params.eco_rating)
        
        # Featured filter
        if search_params.is_featured is not None:
            query = query.filter(models.Product.is_featured == search_params.is_featured)
        
        # Tags filter
        if search_params.tags:
            for tag in search_params.tags:
                query = query.filter(models.Product.tags.op('@>')([tag]))
        
        # Get total count before pagination
        total = query.count()
        
        # Sorting
        sort_column = getattr(models.Product, search_params.sort_by, models.Product.created_at)
        if search_params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Pagination
        products = query.offset(search_params.skip).limit(search_params.limit).all()
        
        return products, total

    @staticmethod
    def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
        db_product = models.Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    @staticmethod
    def update_product(
        db: Session,
        product_id: int,
        product_update: schemas.ProductUpdate
    ) -> Optional[models.Product]:
        db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if db_product:
            update_data = product_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_product, field, value)
            db.commit()
            db.refresh(db_product)
        return db_product

    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if db_product:
            db_product.is_active = False
            db.commit()
            return True
        return False

    @staticmethod
    def get_featured_products(db: Session, limit: int = 10) -> List[models.Product]:
        return (db.query(models.Product)
                .filter(and_(models.Product.is_featured == True, models.Product.is_active == True))
                .limit(limit)
                .all())

    @staticmethod
    def get_low_stock_products(db: Session, threshold: int = 10) -> List[models.Product]:
        return (db.query(models.Product)
                .filter(and_(models.Product.stock_quantity <= threshold, models.Product.is_active == True))
                .all())
