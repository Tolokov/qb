from typing import Any

from app.repositories.spark_repository import TABLE_SCHEMAS


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
        return [dict(r) for r in self._data[table_name]]

    def get_by_id(self, table_name: str, id_value: int) -> dict[str, Any] | None:
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        for row in self._data[table_name]:
            if row.get("id") == id_value:
                return dict(row)
        return None

    def create(self, table_name: str, row: dict[str, Any]) -> dict[str, Any]:
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        out = dict(row)
        self._data[table_name].append(out)
        return out

    def update(self, table_name: str, id_value: int, row: dict[str, Any]) -> dict[str, Any] | None:
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        for i, r in enumerate(self._data[table_name]):
            if r.get("id") == id_value:
                self._data[table_name][i] = dict(row)
                return dict(row)
        return None

    def delete(self, table_name: str, id_value: int) -> bool:
        if table_name not in TABLE_SCHEMAS:
            raise ValueError(f"Unknown table: {table_name}. Allowed: {list(TABLE_SCHEMAS)}")
        for i, r in enumerate(self._data[table_name]):
            if r.get("id") == id_value:
                self._data[table_name].pop(i)
                return True
        return False
