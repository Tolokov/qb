import logging
from typing import Any

from fastapi import HTTPException

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

RESOURCE_TABLE = {"users": "users", "orders": "orders", "products": "products"}


class CrudService:
    """Validates CRUD input and delegates to SparkRepository."""

    def __init__(self, repository: SparkRepository) -> None:
        self._repo = repository

    def _ensure_table(self, table: str) -> None:
        if table not in RESOURCE_TABLE.values():
            raise HTTPException(status_code=400, detail=f"Unknown resource: {table}")

    def list_users(self) -> list[UserResponse]:
        self._ensure_table("users")
        try:
            rows = self._repo.list_table("users")
            return [UserResponse.model_validate(r) for r in rows]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

    def get_user(self, id_value: int) -> UserResponse:
        self._ensure_table("users")
        try:
            row = self._repo.get_by_id("users", id_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if row is None:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse.model_validate(row)

    def create_user(self, body: UserCreate) -> UserResponse:
        self._ensure_table("users")
        data = body.model_dump()
        try:
            created = self._repo.create("users", data)
            return UserResponse.model_validate(created)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

    def update_user(self, id_value: int, body: UserUpdate) -> UserResponse:
        self._ensure_table("users")
        try:
            existing = self._repo.get_by_id("users", id_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if existing is None:
            raise HTTPException(status_code=404, detail="User not found")
        merged = {**existing, **body.model_dump(exclude_unset=True)}
        _coerce_row(merged, ("created_at",))
        try:
            updated = self._repo.update("users", id_value, merged)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        return UserResponse.model_validate(updated)

    def delete_user(self, id_value: int) -> None:
        self._ensure_table("users")
        try:
            deleted = self._repo.delete("users", id_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if not deleted:
            raise HTTPException(status_code=404, detail="User not found")

    def list_orders(self) -> list[OrderResponse]:
        self._ensure_table("orders")
        try:
            rows = self._repo.list_table("orders")
            return [OrderResponse.model_validate(r) for r in rows]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

    def get_order(self, id_value: int) -> OrderResponse:
        self._ensure_table("orders")
        try:
            row = self._repo.get_by_id("orders", id_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if row is None:
            raise HTTPException(status_code=404, detail="Order not found")
        return OrderResponse.model_validate(row)

    def create_order(self, body: OrderCreate) -> OrderResponse:
        self._ensure_table("orders")
        data = body.model_dump()
        try:
            created = self._repo.create("orders", data)
            return OrderResponse.model_validate(created)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

    def update_order(self, id_value: int, body: OrderUpdate) -> OrderResponse:
        self._ensure_table("orders")
        try:
            existing = self._repo.get_by_id("orders", id_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if existing is None:
            raise HTTPException(status_code=404, detail="Order not found")
        merged = {**existing, **body.model_dump(exclude_unset=True)}
        try:
            updated = self._repo.update("orders", id_value, merged)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        return OrderResponse.model_validate(updated)

    def delete_order(self, id_value: int) -> None:
        self._ensure_table("orders")
        try:
            deleted = self._repo.delete("orders", id_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if not deleted:
            raise HTTPException(status_code=404, detail="Order not found")

    def list_products(self) -> list[ProductResponse]:
        self._ensure_table("products")
        try:
            rows = self._repo.list_table("products")
            return [ProductResponse.model_validate(r) for r in rows]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

    def get_product(self, id_value: int) -> ProductResponse:
        self._ensure_table("products")
        try:
            row = self._repo.get_by_id("products", id_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if row is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return ProductResponse.model_validate(row)

    def create_product(self, body: ProductCreate) -> ProductResponse:
        self._ensure_table("products")
        data = body.model_dump()
        try:
            created = self._repo.create("products", data)
            return ProductResponse.model_validate(created)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

    def update_product(self, id_value: int, body: ProductUpdate) -> ProductResponse:
        self._ensure_table("products")
        try:
            existing = self._repo.get_by_id("products", id_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if existing is None:
            raise HTTPException(status_code=404, detail="Product not found")
        merged = {**existing, **body.model_dump(exclude_unset=True)}
        _coerce_row(merged, ("created_at",))
        try:
            updated = self._repo.update("products", id_value, merged)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        return ProductResponse.model_validate(updated)

    def delete_product(self, id_value: int) -> None:
        self._ensure_table("products")
        try:
            deleted = self._repo.delete("products", id_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if not deleted:
            raise HTTPException(status_code=404, detail="Product not found")


def _coerce_row(row: dict[str, Any], datetime_keys: tuple[str, ...]) -> None:
    """Convert datetime objects to ISO strings for Spark schema compatibility."""
    for k in datetime_keys:
        if k in row and hasattr(row[k], "isoformat"):
            row[k] = row[k].isoformat()