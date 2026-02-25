import logging
from collections.abc import Callable
from typing import Any, TypeVar

from fastapi import HTTPException, status
from pydantic import BaseModel
from pydantic_core import PydanticCustomError

from app.repositories.spark_repository import SparkRepository

logger = logging.getLogger(__name__)

_R = TypeVar("_R")
T = TypeVar("T", bound=BaseModel)

RESOURCE_TABLE = {"users": "users", "orders": "orders", "products": "products"}


class CrudService:
    def __init__(self, repository: SparkRepository) -> None:
        self._repo = repository

    def _repo_call(self, fn: Callable[[], _R]) -> _R:
        """Execute a repository operation, converting all errors to HTTPException."""
        try:
            return fn()
        except HTTPException:
            raise
        except PydanticCustomError as e:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        except Exception as e:
            logger.error("Spark/repository error: %s", e, exc_info=False)
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e

    def _ensure_table(self, table: str) -> None:
        if table not in RESOURCE_TABLE.values():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown resource: {table}")

    def list(self, table: str, model: type[T]) -> list[T]:
        self._ensure_table(table)
        rows = self._repo_call(lambda: self._repo.list_table(table))
        return [model.model_validate(r) for r in rows]

    def get(self, table: str, id_value: int, model: type[T], not_found_detail: str) -> T:
        self._ensure_table(table)
        row = self._repo_call(lambda: self._repo.get_by_id(table, id_value))
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=not_found_detail)
        return model.model_validate(row)

    def create(self, table: str, body: BaseModel, model: type[T]) -> T:
        self._ensure_table(table)
        created = self._repo_call(lambda: self._repo.create(table, body.model_dump()))
        return model.model_validate(created)

    def update(
        self,
        table: str,
        id_value: int,
        body: BaseModel,
        model: type[T],
        not_found_detail: str,
        datetime_keys: tuple[str, ...] = (),
    ) -> T:
        self._ensure_table(table)
        existing = self._repo_call(lambda: self._repo.get_by_id(table, id_value))
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=not_found_detail)
        merged = {**existing, **body.model_dump(exclude_unset=True)}
        _coerce_row(merged, datetime_keys)
        updated = self._repo_call(lambda: self._repo.update(table, id_value, merged))
        return model.model_validate(updated)

    def delete(self, table: str, id_value: int, not_found_detail: str) -> None:
        self._ensure_table(table)
        deleted = self._repo_call(lambda: self._repo.delete(table, id_value))
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=not_found_detail)


def _coerce_row(row: dict[str, Any], datetime_keys: tuple[str, ...]) -> None:
    for k in datetime_keys:
        if k in row and hasattr(row[k], "isoformat"):
            row[k] = row[k].isoformat()
