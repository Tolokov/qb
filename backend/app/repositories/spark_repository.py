from decimal import Decimal
from datetime import datetime
from typing import Any

from pyspark.sql import SparkSession
from pyspark.sql.functions import col

from app.spark_tables import (
    USERS_SCHEMA,
    ORDERS_SCHEMA,
    PRODUCTS_SCHEMA,
    create_tables_and_view,
)

TABLE_SCHEMAS = {
    "users": USERS_SCHEMA,
    "orders": ORDERS_SCHEMA,
    "products": PRODUCTS_SCHEMA,
}


def _row_to_json(row: Any) -> dict[str, Any]:
    """Convert Spark Row to JSON-serializable dict (Decimal -> float, datetime -> iso)."""
    if row is None:
        return {}
    d = row.asDict() if hasattr(row, "asDict") else dict(row)
    out: dict[str, Any] = {}
    for k, v in d.items():
        if v is None:
            out[k] = None
        elif isinstance(v, Decimal):
            out[k] = float(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


class SparkRepository:
    """CRUD for Spark tables: users, orders, products."""

    def __init__(self, spark: SparkSession) -> None:
        self._spark = spark
        create_tables_and_view(spark)

    def list_table(self, table_name: str) -> list[dict[str, Any]]:
        """List all rows in table. Returns list of JSON-serializable dicts."""
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        df = self._spark.table(table_name)
        rows = df.collect()
        return [_row_to_json(r) for r in rows]

    def get_by_id(self, table_name: str, id_value: int) -> dict[str, Any] | None:
        """Get a single row by id. Returns None if not found."""
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        df = self._spark.table(table_name).filter(col("id") == id_value)
        rows = df.limit(1).collect()
        if not rows:
            return None
        return _row_to_json(rows[0])

    def create(self, table_name: str, row: dict[str, Any]) -> dict[str, Any]:
        """Append one row to the table. Returns the created row (with id)."""
        schema = TABLE_SCHEMAS.get(table_name)
        if not schema:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        new_df = self._spark.createDataFrame([row], schema)
        new_df.write.mode("append").saveAsTable(table_name)
        return _row_to_json(new_df.collect()[0])

    def update(self, table_name: str, id_value: int, row: dict[str, Any]) -> dict[str, Any] | None:
        """Update row with given id. Overwrites table. Returns updated row or None."""
        schema = TABLE_SCHEMAS.get(table_name)
        if not schema:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        df = self._spark.table(table_name)
        existing = df.filter(col("id") == id_value).collect()
        if not existing:
            return None
        rest = df.filter(col("id") != id_value)
        updated_row = self._spark.createDataFrame([row], schema)
        combined = rest.unionByName(updated_row, allowMissingColumns=True)
        combined.write.mode("overwrite").saveAsTable(table_name)
        return _row_to_json(updated_row.collect()[0])

    def delete(self, table_name: str, id_value: int) -> bool:
        """Delete row with given id. Returns True if deleted, False if not found."""
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        df = self._spark.table(table_name)
        to_keep = df.filter(col("id") != id_value)
        if to_keep.count() == df.count():
            return False
        to_keep.write.mode("overwrite").saveAsTable(table_name)
        return True
