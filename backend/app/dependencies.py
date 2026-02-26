import logging
from functools import lru_cache

from fastapi import HTTPException, status

from app.repositories.ibis_repository import IbisRepository
from app.repositories.json_ibis_repository import JsonSQLIbisRepository
from app.repositories.raw_ibis_repository import RawSQLIbisRepository
from app.services.base import IQueryRepository
from app.services.query_service import QueryService
from app.spark_session import get_spark_session

logger = logging.getLogger(__name__)


@lru_cache
def get_ibis_repository() -> IbisRepository:
    """Return Ibis-backed repository or fail with 503 if Spark is unavailable."""
    try:
        spark = get_spark_session()
        return IbisRepository(spark=spark)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Ibis/Spark unavailable: %s", e, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Ibis/Spark unavailable"
        ) from e


@lru_cache
def get_json_ibis_repository() -> JsonSQLIbisRepository:
    """Repository for JSON_SQL payloads backed by Spark + Ibis."""
    try:
        spark = get_spark_session()
        return JsonSQLIbisRepository(spark=spark)
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        logger.error("JsonSQL Ibis repository unavailable: %s", e, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Ibis/Spark unavailable"
        ) from e


@lru_cache
def get_raw_sql_ibis_repository() -> RawSQLIbisRepository:
    """Repository for raw SQL strings backed by Spark + Ibis."""
    try:
        spark = get_spark_session()
        return RawSQLIbisRepository(spark=spark)
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        logger.error("Raw SQL Ibis repository unavailable: %s", e, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Ibis/Spark unavailable"
        ) from e


def _build_query_service(repository: IQueryRepository) -> QueryService:
    """Вспомогательный конструктор сервиса, чтобы не дублировать код."""
    return QueryService(repository=repository)


@lru_cache
def get_json_query_service() -> QueryService:
    """Query service for JSON_SQL payloads."""
    return _build_query_service(get_json_ibis_repository())


@lru_cache
def get_sql_query_service() -> QueryService:
    """Query service for raw SQL strings."""
    return _build_query_service(get_raw_sql_ibis_repository())


def get_query_service() -> QueryService:
    """Backward-compatible alias: JSON_SQL query service."""
    return get_json_query_service()
