import logging
from collections.abc import Callable
from typing import Any, TypeVar

from fastapi import HTTPException, status
from pydantic_core import PydanticCustomError

from app.api.v1.schemas.crud import (
    OrderCreate,
    OrderResponse,
    OrderUpdate,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from app.repositories.spark_repository import SparkRepository

logger = logging.getLogger(__name__)

T = TypeVar("T")

RESOURCE_TABLE = {"users": "users", "orders": "orders", "products": "products"}


class CrudService:
    def __init__(self, repository: SparkRepository) -> None:
        self._repo = repository

    def _repo_call(self, fn: Callable[[], T]) -> T:
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

    # --- Users ---

    def list_users(self) -> list[UserResponse]:
        self._ensure_table("users")
        rows = self._repo_call(lambda: self._repo.list_table("users"))
        return [UserResponse.model_validate(r) for r in rows]

    def get_user(self, id_value: int) -> UserResponse:
        self._ensure_table("users")
        row = self._repo_call(lambda: self._repo.get_by_id("users", id_value))
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return UserResponse.model_validate(row)

    def create_user(self, body: UserCreate) -> UserResponse:
        self._ensure_table("users")
        created = self._repo_call(lambda: self._repo.create("users", body.model_dump()))
        return UserResponse.model_validate(created)

    def update_user(self, id_value: int, body: UserUpdate) -> UserResponse:
        self._ensure_table("users")
        existing = self._repo_call(lambda: self._repo.get_by_id("users", id_value))
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        merged = {**existing, **body.model_dump(exclude_unset=True)}
        _coerce_row(merged, ("created_at",))
        updated = self._repo_call(lambda: self._repo.update("users", id_value, merged))
        return UserResponse.model_validate(updated)

    def delete_user(self, id_value: int) -> None:
        self._ensure_table("users")
        deleted = self._repo_call(lambda: self._repo.delete("users", id_value))
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # --- Orders ---

    def list_orders(self) -> list[OrderResponse]:
        self._ensure_table("orders")
        rows = self._repo_call(lambda: self._repo.list_table("orders"))
        return [OrderResponse.model_validate(r) for r in rows]

    def get_order(self, id_value: int) -> OrderResponse:
        self._ensure_table("orders")
        row = self._repo_call(lambda: self._repo.get_by_id("orders", id_value))
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return OrderResponse.model_validate(row)

    def create_order(self, body: OrderCreate) -> OrderResponse:
        self._ensure_table("orders")
        created = self._repo_call(lambda: self._repo.create("orders", body.model_dump()))
        return OrderResponse.model_validate(created)

    def update_order(self, id_value: int, body: OrderUpdate) -> OrderResponse:
        self._ensure_table("orders")
        existing = self._repo_call(lambda: self._repo.get_by_id("orders", id_value))
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        merged = {**existing, **body.model_dump(exclude_unset=True)}
        updated = self._repo_call(lambda: self._repo.update("orders", id_value, merged))
        return OrderResponse.model_validate(updated)

    def delete_order(self, id_value: int) -> None:
        self._ensure_table("orders")
        deleted = self._repo_call(lambda: self._repo.delete("orders", id_value))
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # --- Products ---

    def list_products(self) -> list[ProductResponse]:
        self._ensure_table("products")
        rows = self._repo_call(lambda: self._repo.list_table("products"))
        return [ProductResponse.model_validate(r) for r in rows]

    def get_product(self, id_value: int) -> ProductResponse:
        self._ensure_table("products")
        row = self._repo_call(lambda: self._repo.get_by_id("products", id_value))
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return ProductResponse.model_validate(row)

    def create_product(self, body: ProductCreate) -> ProductResponse:
        self._ensure_table("products")
        created = self._repo_call(lambda: self._repo.create("products", body.model_dump()))
        return ProductResponse.model_validate(created)

    def update_product(self, id_value: int, body: ProductUpdate) -> ProductResponse:
        self._ensure_table("products")
        existing = self._repo_call(lambda: self._repo.get_by_id("products", id_value))
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        merged = {**existing, **body.model_dump(exclude_unset=True)}
        _coerce_row(merged, ("created_at",))
        updated = self._repo_call(lambda: self._repo.update("products", id_value, merged))
        return ProductResponse.model_validate(updated)

    def delete_product(self, id_value: int) -> None:
        self._ensure_table("products")
        deleted = self._repo_call(lambda: self._repo.delete("products", id_value))
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")


def _coerce_row(row: dict[str, Any], datetime_keys: tuple[str, ...]) -> None:
    for k in datetime_keys:
        if k in row and hasattr(row[k], "isoformat"):
            row[k] = row[k].isoformat()
