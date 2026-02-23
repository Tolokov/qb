import logging
from datetime import datetime
from decimal import Decimal
from typing import Any

from app.repositories.spark_repository import TABLE_SCHEMAS

logger = logging.getLogger(__name__)


def _row_to_response(row: dict[str, Any]) -> dict[str, Any]:
    """Convert row to JSON-safe types (datetime -> str, Decimal -> float)."""
    out: dict[str, Any] = {}
    for k, v in row.items():
        if v is None:
            out[k] = None
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, Decimal):
            out[k] = float(v)
        else:
            out[k] = v
    return out

SEED_USERS = [
    {"id": 1, "name": "Alice", "created_at": "2025-01-15T12:00:00", "score": 10.5, "active": True},
    {"id": 2, "name": "Bob", "created_at": "2025-01-15T12:00:00", "score": 20.0, "active": True},
    {"id": 3, "name": "Carol", "created_at": "2025-01-15T12:00:00", "score": 15.75, "active": False},
]
SEED_ORDERS = [
    {"id": 1, "user_id": 1, "notes": "First order", "total": 99.99, "completed": True},
    {"id": 2, "user_id": 2, "notes": "Second order", "total": 49.5, "completed": False},
    {"id": 3, "user_id": 1, "notes": "Third order", "total": 25.0, "completed": True},
]
SEED_PRODUCTS = [
    {"id": 1, "name": "Widget", "price": 12.99, "created_at": "2025-01-15T12:00:00", "in_stock": True},
    {"id": 2, "name": "Gadget", "price": 29.99, "created_at": "2025-01-15T12:00:00", "in_stock": True},
    {"id": 3, "name": "Gizmo", "price": 5.5, "created_at": "2025-01-15T12:00:00", "in_stock": False},
]


class MemorySparkRepository:
    """In-memory CRUD with same interface as SparkRepository. Used when JVM/Spark is unavailable."""

    def __init__(self) -> None:
        self._data: dict[str, list[dict[str, Any]]] = {
            "users": [dict(r) for r in SEED_USERS],
            "orders": [dict(r) for r in SEED_ORDERS],
            "products": [dict(r) for r in SEED_PRODUCTS],
        }

    def list_table(self, table_name: str) -> list[dict[str, Any]]:
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        return [_row_to_response(dict(r)) for r in self._data[table_name]]

    def get_by_id(self, table_name: str, id_value: int) -> dict[str, Any] | None:
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        for row in self._data[table_name]:
            if row.get("id") == id_value:
                return _row_to_response(dict(row))
        return None

    def create(self, table_name: str, row: dict[str, Any]) -> dict[str, Any]:
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        out = dict(row)
        self._data[table_name].append(out)
        return _row_to_response(out)

    def update(self, table_name: str, id_value: int, row: dict[str, Any]) -> dict[str, Any] | None:
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        for i, r in enumerate(self._data[table_name]):
            if r.get("id") == id_value:
                self._data[table_name][i] = dict(row)
                return _row_to_response(self._data[table_name][i])
        return None

    def delete(self, table_name: str, id_value: int) -> bool:
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        for i, r in enumerate(self._data[table_name]):
            if r.get("id") == id_value:
                self._data[table_name].pop(i)
                return True
        return False
