"""
Category API routes for the catalog service.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=List[schemas.Category])
def list_categories(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    db: Session = Depends(get_db)
):
    """List all active categories."""
    categories = crud.CategoryCRUD.get_categories(db, skip=skip, limit=limit)
    return categories


@router.get("/{category_id}", response_model=schemas.Category)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific category by ID."""
    category = crud.CategoryCRUD.get_category(db, category_id=category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=schemas.Category, status_code=201)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category."""
    # Check if parent category exists if parent_id is provided
    if category.parent_id:
        parent = crud.CategoryCRUD.get_category(db, category_id=category.parent_id)
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category not found")
    
    return crud.CategoryCRUD.create_category(db=db, category=category)


@router.put("/{category_id}", response_model=schemas.Category)
def update_category(
    category_id: int,
    category_update: schemas.CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category."""
    # Check if category exists
    existing_category = crud.CategoryCRUD.get_category(db, category_id=category_id)
    if not existing_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if parent category exists if parent_id is being updated
    if category_update.parent_id:
        parent = crud.CategoryCRUD.get_category(db, category_id=category_update.parent_id)
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category not found")
        
        # Prevent circular reference
        if category_update.parent_id == category_id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")
    
    updated_category = crud.CategoryCRUD.update_category(
        db=db, category_id=category_id, category_update=category_update
    )
    return updated_category


@router.delete("/{category_id}", response_model=schemas.APIResponse)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Soft delete a category (sets is_active to False)."""
    success = crud.CategoryCRUD.delete_category(db, category_id=category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return schemas.APIResponse(message="Category deleted successfully")
