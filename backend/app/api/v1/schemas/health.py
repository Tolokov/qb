from typing import Literal

from pydantic import BaseModel

STATUS_OK = "ok"
STATUS_DEGRADED = "degraded"

class ComponentHealth(BaseModel):
    status: Literal["ok", "down"]
    detail: str = "No errors"


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    backend: ComponentHealth
    frontend: ComponentHealth
    spark: ComponentHealth
