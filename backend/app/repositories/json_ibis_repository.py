from typing import Any

from pyspark.sql import SparkSession

from app.repositories.ibis_repository import IbisRepository
from app.services.base import IQueryRepository


class JsonSQLIbisRepository(IQueryRepository):
    """Repository for JSON_SQL payloads backed by Spark + Ibis."""

    def __init__(self, spark: SparkSession) -> None:
        self._inner = IbisRepository(spark=spark)

    def execute(self, query: object) -> dict[str, Any]:
        return self._inner.execute(query)

