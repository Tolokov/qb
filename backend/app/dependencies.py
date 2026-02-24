import logging
from functools import lru_cache

from fastapi import HTTPException, status

from app.repositories.echo_repository import EchoQueryRepository
from app.repositories.spark_repository import SparkRepository
from app.services.crud_service import CrudService
from app.services.query_service import QueryService
from app.spark_session import get_spark_session

logger = logging.getLogger(__name__)


@lru_cache
def get_query_repository() -> EchoQueryRepository:
    return EchoQueryRepository()


def get_query_service() -> QueryService:
    return QueryService(repository=get_query_repository())


@lru_cache
def get_spark_repository() -> SparkRepository:
    """Return Spark-backed repository or fail with 503 if Spark is unavailable."""
    try:
        spark = get_spark_session()
    except Exception as e:  # pragma: no cover - environment-specific failures
        logger.error("Spark/JVM unavailable for CRUD: %s", e, exc_info=False)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Spark/JVM unavailable"
        ) from e
    return SparkRepository(spark=spark)


def get_crud_service() -> CrudService:
    return CrudService(repository=get_spark_repository())
