from functools import lru_cache
from pathlib import Path

from pyspark.sql import SparkSession

from app.config import SETTINGS


@lru_cache
def get_spark_session() -> SparkSession:
    """Return a cached SparkSession configured from app settings."""
    warehouse = Path(SETTINGS.SPARK_WAREHOUSE_DIR).resolve().as_posix()
    return (
        SparkSession.builder.appName("query-builder-service")
        .master(SETTINGS.SPARK_MASTER)
        .config("spark.sql.warehouse.dir", warehouse)
        .enableHiveSupport()
        .getOrCreate()
    )
