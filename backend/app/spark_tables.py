from datetime import datetime
from decimal import Decimal

from pyspark.sql import SparkSession
from pyspark.sql import types as T

# ---------------------------------------------------------------------------
# Table schemas (5 columns each: int, string, timestamp, decimal, boolean)
# ---------------------------------------------------------------------------

USERS_SCHEMA = T.StructType(
    [
        T.StructField("id", T.IntegerType(), False),
        T.StructField("name", T.StringType(), True),
        T.StructField("created_at", T.TimestampType(), True),
        T.StructField("score", T.DecimalType(10, 2), True),
        T.StructField("active", T.BooleanType(), True),
    ]
)

ORDERS_SCHEMA = T.StructType(
    [
        T.StructField("id", T.IntegerType(), False),
        T.StructField("user_id", T.IntegerType(), True),
        T.StructField("notes", T.StringType(), True),
        T.StructField("total", T.DecimalType(10, 2), True),
        T.StructField("completed", T.BooleanType(), True),
    ]
)

PRODUCTS_SCHEMA = T.StructType(
    [
        T.StructField("id", T.IntegerType(), False),
        T.StructField("name", T.StringType(), True),
        T.StructField("price", T.DecimalType(10, 2), True),
        T.StructField("created_at", T.TimestampType(), True),
        T.StructField("in_stock", T.BooleanType(), True),
    ]
)

TABLE_NAMES = ("users", "orders", "products")
VIEW_NAME = "user_orders_mart"


def _ensure_table(spark: SparkSession, table_name: str, schema: T.StructType) -> None:
    if table_name not in [t.name for t in spark.catalog.listTables()]:
        empty = spark.createDataFrame([], schema)
        empty.write.saveAsTable(table_name, mode="overwrite")


def _seed_if_empty(spark: SparkSession) -> None:
    base = datetime(2025, 1, 15, 12, 0, 0)
    if spark.table("users").count() == 0:
        users_data = [
            (1, "Alice", base, Decimal("10.50"), True),
            (2, "Bob", base, Decimal("20.00"), True),
            (3, "Carol", base, Decimal("15.75"), False),
        ]
        spark.createDataFrame(users_data, USERS_SCHEMA).write.mode("append").saveAsTable("users")
    if spark.table("orders").count() == 0:
        orders_data = [
            (1, 1, "First order", Decimal("99.99"), True),
            (2, 2, "Second order", Decimal("49.50"), False),
            (3, 1, "Third order", Decimal("25.00"), True),
        ]
        spark.createDataFrame(orders_data, ORDERS_SCHEMA).write.mode("append").saveAsTable("orders")
    if spark.table("products").count() == 0:
        products_data = [
            (1, "Widget", Decimal("12.99"), base, True),
            (2, "Gadget", Decimal("29.99"), base, True),
            (3, "Gizmo", Decimal("5.50"), base, False),
        ]
        spark.createDataFrame(products_data, PRODUCTS_SCHEMA).write.mode("append").saveAsTable(
            "products"
        )


def create_tables_and_view(spark: SparkSession) -> None:
    _ensure_table(spark, "users", USERS_SCHEMA)
    _ensure_table(spark, "orders", ORDERS_SCHEMA)
    _ensure_table(spark, "products", PRODUCTS_SCHEMA)
    _seed_if_empty(spark)
    if VIEW_NAME not in [t.name for t in spark.catalog.listTables()]:
        spark.sql(
            """
            CREATE OR REPLACE VIEW user_orders_mart AS
            SELECT u.id AS user_id, u.name AS user_name, o.id AS order_id, o.total, o.completed
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            """
        )
