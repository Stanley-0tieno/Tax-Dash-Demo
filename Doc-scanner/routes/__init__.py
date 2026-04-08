from fastapi import APIRouter
from .upload_routes import router as upload_router
from .scanner_routes import router as scanner_router

router = APIRouter()
router.include_router(upload_router)
router.include_router(scanner_router)