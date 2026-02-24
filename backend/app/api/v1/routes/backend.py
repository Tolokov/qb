import logging
import urllib.error
import urllib.request

from fastapi import APIRouter, status

from app.api.v1.schemas.health import ComponentHealth, HealthResponse
from app.config import SETTINGS
from app.spark_session import get_spark_session

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


def _check_frontend() -> ComponentHealth:
    origins = SETTINGS.cors_origins_list
    url = origins[0].rstrip("/") if origins else "http://localhost:3000"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:  # type: HTTPResponse
            if resp.status < 500:
                return ComponentHealth(status="ok")
            return ComponentHealth(status="down", detail=f"HTTP {resp.status}")
    except urllib.error.HTTPError as exc:
        if exc.code < 500:
            return ComponentHealth(status="ok")
        return ComponentHealth(status="down", detail=f"HTTP {exc.code}")
    except Exception as exc:
        return ComponentHealth(status="down", detail=str(exc))


def _check_spark() -> ComponentHealth:
    try:
        spark = get_spark_session()
        spark.sql("SELECT 1").collect()
        return ComponentHealth(status="ok")
    except Exception as exc:
        logger.warning("Spark health check failed: %s", exc)
        return ComponentHealth(status="down", detail=str(exc))


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Healthcheck",
    description="Проверяет доступность бекенда, фронтенда и Spark-сессии.",
    status_code=status.HTTP_200_OK,
)
def healthcheck() -> HealthResponse:
    backend_health = ComponentHealth(status="ok")
    frontend_health = _check_frontend()
    spark_health = _check_spark()

    overall = "ok" if frontend_health.status == "ok" and spark_health.status == "ok" else "degraded"

    return HealthResponse(
        status=overall,
        backend=backend_health,
        frontend=frontend_health,
        spark=spark_health,
    )
