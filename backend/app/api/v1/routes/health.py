from fastapi import APIRouter, status

from app.api.v1.schemas.health import ComponentHealth, HealthResponse, STATUS_OK, STATUS_DEGRADED
from app.utils import _check_frontend, _check_spark

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Healthcheck",
    description="Проверяет доступность бекенда, фронтенда и Spark-сессии.",
    status_code=status.HTTP_200_OK,
)
def healthcheck(
    backend_health: ComponentHealth = ComponentHealth(status=STATUS_OK),
    frontend_health: ComponentHealth = _check_frontend(),
    spark_health: ComponentHealth = _check_spark(),
) -> HealthResponse:
    overall = STATUS_OK if frontend_health.status == STATUS_OK and spark_health.status == STATUS_OK else STATUS_DEGRADED
    return HealthResponse(backend=backend_health, frontend=frontend_health, spark=spark_health, status=overall)
