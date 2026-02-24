from typing import Literal

from pydantic import BaseModel


class ComponentHealth(BaseModel):
    status: Literal["ok", "down"]
    detail: str | None = None


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    backend: ComponentHealth
    frontend: ComponentHealth
    spark: ComponentHealth
