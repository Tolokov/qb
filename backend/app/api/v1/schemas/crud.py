from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Users (id, name, created_at, score, active)
# ---------------------------------------------------------------------------


class UserCreate(BaseModel):
    id: int
    name: str | None = None
    created_at: datetime | None = None
    score: Decimal | float | None = None
    active: bool | None = True


class UserUpdate(BaseModel):
    name: str | None = None
    created_at: datetime | None = None
    score: Decimal | float | None = None
    active: bool | None = None


class UserResponse(BaseModel):
    id: int
    name: str | None = None
    created_at: str | None = None
    score: float | None = None
    active: bool | None = None


# ---------------------------------------------------------------------------
# Orders (id, user_id, notes, total, completed)
# ---------------------------------------------------------------------------


class OrderCreate(BaseModel):
    id: int
    user_id: int | None = None
    notes: str | None = None
    total: Decimal | float | None = None
    completed: bool | None = False


class OrderUpdate(BaseModel):
    user_id: int | None = None
    notes: str | None = None
    total: Decimal | float | None = None
    completed: bool | None = None


class OrderResponse(BaseModel):
    id: int
    user_id: int | None = None
    notes: str | None = None
    total: float | None = None
    completed: bool | None = None


# ---------------------------------------------------------------------------
# Products (id, name, price, created_at, in_stock)
# ---------------------------------------------------------------------------


class ProductCreate(BaseModel):
    id: int
    name: str | None = None
    price: Decimal | float | None = None
    created_at: datetime | None = None
    in_stock: bool | None = True


class ProductUpdate(BaseModel):
    name: str | None = None
    price: Decimal | float | None = None
    created_at: datetime | None = None
    in_stock: bool | None = None


class ProductResponse(BaseModel):
    id: int
    name: str | None = None
    price: float | None = None
    created_at: str | None = None
    in_stock: bool | None = None
