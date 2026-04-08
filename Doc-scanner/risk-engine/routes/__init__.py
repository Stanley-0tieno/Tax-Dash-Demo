from fastapi import APIRouter
from .risk_routes import router as risk_router

router = APIRouter()
router.include_router(risk_router)