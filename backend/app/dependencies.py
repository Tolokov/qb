import logging
from functools import lru_cache

from app.repositories.echo_repository import EchoQueryRepository
from app.repositories.memory_repository import MemorySparkRepository
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
def get_spark_repository() -> SparkRepository | MemorySparkRepository:
    try:
        spark = get_spark_session()
        return SparkRepository(spark=spark)
    except Exception as e:
        logger.warning(
            "Spark/JVM unavailable, using in-memory CRUD: %s",
            e,
            exc_info=False,
        )
        return MemorySparkRepository()


def get_crud_service() -> CrudService:
    return CrudService(repository=get_spark_repository())
