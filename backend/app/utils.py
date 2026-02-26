import urllib.error
import urllib.request
from typing import Any

from app.config import SETTINGS
from app.spark_session import get_spark_session
from app.api.v1.schemas.health import ComponentHealth
import logging

logger = logging.getLogger(__name__)


def _check_frontend() -> ComponentHealth:
    """Проверяет доступность фронтенда"""
    origins = SETTINGS.cors_origins_list
    if not origins:
        return ComponentHealth(status="ok")
    url = origins[0].rstrip("/")
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=SETTINGS.HEALTH_CHECK_TIMEOUT_SEC) as resp:
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
    """Проверяет доступность spark ноды"""
    try:
        spark = get_spark_session()
        spark.sql("SELECT 1").collect()
        return ComponentHealth(status="ok")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Spark health check failed: %s", exc)
        return ComponentHealth(status="down", detail=str(exc))


from fastapi.openapi.utils import get_openapi
import json
from pathlib import Path


def include_openapi(app):
    """Вынесение openapi в локаль"""
    # Cache OpenAPI spec under the backend directory so the backend
    # container owns and serves its own schema file.
    openapi_cache_path = Path(__file__).resolve().parents[1] / "openapi.json"

    @app.get(
        "/.well-known/appspecific/com.chrome.devtools.json",
        include_in_schema=False,
    )
    def _chrome_devtools_well_known() -> dict:
        return {}

    if app.openapi_schema:
        return app

    if openapi_cache_path.exists():
        app.openapi_schema = json.loads(openapi_cache_path.read_text(encoding="utf-8"))
        return app
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    openapi_cache_path.write_text(
        json.dumps(openapi_schema, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return app


def get_query_logger():
    QUERY_LOG_PATH = Path(__file__).resolve().parents[5] / "logs" / "queries.jsonl"
    QUERY_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    query_logger = logging.getLogger("query.requests")
    query_logger.setLevel(logging.DEBUG)
    query_logger.propagate = False
    if not query_logger.handlers:
        _handler = logging.FileHandler(QUERY_LOG_PATH, encoding="utf-8")
        _handler.setFormatter(logging.Formatter("%(message)s"))
        query_logger.addHandler(_handler)
    return query_logger


def extract_payload(body: Any) -> Any:
    """Extract payload from body. Backward compatible: {"payload": x} -> x; else body as-is."""
    if isinstance(body, dict) and "payload" in body:
        return body["payload"]
    return body
