from datetime import datetime
from decimal import Decimal
from typing import Any

from app.exceptions import DuplicateIdError
from app.repositories.spark_repository import TABLE_SCHEMAS


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


class FakeSparkRepository:
    """CRUD in memory; same interface as SparkRepository."""

    def __init__(self) -> None:
        self._data: dict[str, list[dict[str, Any]]] = {
            "users": [],
            "orders": [],
            "products": [],
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
        if "id" in row and self.get_by_id(table_name, row["id"]) is not None:
            raise DuplicateIdError(f"Row with id {row['id']} already exists")
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
