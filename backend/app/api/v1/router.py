from fastapi import APIRouter

from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.compile import router as compile_router
from app.api.v1.routes.compile_sql import router as compile_sql_router

router = APIRouter()

router.include_router(health_router)
router.include_router(compile_router)
router.include_router(compile_sql_router)
