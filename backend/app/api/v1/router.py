from fastapi import APIRouter
from routes.health import router as health_router
from routes.compile import router as compile_router
from routes.compile_sql import router as compile_router_sql

router = APIRouter(tags=["Query"])

router.include_router(health_router)
router.include_router(compile_router)
router.include_router(compile_router_sql)
