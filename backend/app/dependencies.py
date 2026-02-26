import logging
from functools import lru_cache

from fastapi import HTTPException, status

from app.repositories.ibis_repository import IbisRepository
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


def get_query_service() -> QueryService:
    return QueryService(repository=get_ibis_repository())
