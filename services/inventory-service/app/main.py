"""
FastAPI main application for EcoMarket Inventory Service.

This service manages product inventory levels, stock movements,
supplier relationships, and purchase orders.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from .database import engine, Base
from .routers import inventory


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    try:
        # Create database tables
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")
    
    yield
    
    # Shutdown
    print("Inventory service shutting down...")


# Create FastAPI application
app = FastAPI(
    title="EcoMarket Inventory Service",
    description="Inventory management service for the EcoMarket platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(inventory.router, prefix="/api/v1")


@app.get("/", tags=["root"])
async def root():
    """Root endpoint."""
    return {
        "message": "EcoMarket Inventory Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connection
        from .database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        
        return {
            "status": "healthy",
            "service": "inventory-service",
            "database": "connected",
            "timestamp": "2024-01-01T00:00:00Z"  # You can use datetime.utcnow().isoformat() + "Z"
        }
    except SQLAlchemyError as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "inventory-service",
                "database": "disconnected",
                "error": str(e)
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "inventory-service",
                "error": str(e)
            }
        )


@app.get("/api/v1/health", tags=["health"])
async def api_health_check():
    """API health check endpoint for load balancers."""
    return await health_check()


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": "server_error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8005))
    reload = os.getenv("ENVIRONMENT", "production") == "development"
    
    print(f"Starting Inventory Service on {host}:{port}")
    print(f"Environment: {os.getenv('ENVIRONMENT', 'production')}")
    print(f"Reload mode: {reload}")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
