"""
Main FastAPI application for the Product Catalog Service.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from .database import engine, Base
from .routers import products, categories

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
except OperationalError as e:
    print(f"Database connection failed: {e}")
    print("Note: Database will need to be set up before the application can function properly")

# Create FastAPI application
app = FastAPI(
    title="EcoMarket Product Catalog Service",
    description="A comprehensive product catalog service for the EcoMarket platform with search and recommendation capabilities",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")


@app.get("/")
def read_root():
    """Root endpoint with service information."""
    return {
        "service": "EcoMarket Product Catalog Service",
        "version": "1.0.0",
        "status": "active",
        "documentation": "/docs",
        "endpoints": {
            "products": "/api/v1/products",
            "categories": "/api/v1/categories"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    try:
        # Simple database connectivity check
        from .database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "service": "product-catalog"
    }


@app.get("/api/v1/stats")
def get_service_stats():
    """Get basic service statistics."""
    try:
        from .database import SessionLocal
        from . import models
        
        db = SessionLocal()
        
        total_products = db.query(models.Product).filter(models.Product.is_active == True).count()
        total_categories = db.query(models.Category).filter(models.Category.is_active == True).count()
        featured_products = db.query(models.Product).filter(
            models.Product.is_featured == True,
            models.Product.is_active == True
        ).count()
        
        db.close()
        
        return {
            "total_products": total_products,
            "total_categories": total_categories,
            "featured_products": featured_products
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to fetch statistics")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
