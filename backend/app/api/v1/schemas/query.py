from typing import Any

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    payload: dict[str, Any] = Field(
        default_factory=dict,
        description="JSON",
        examples=[{"from": "table", "select": ["*"], "orderBy": [{"column": "id", "direction": "ASC"}]}],
    )


class QueryResponse(BaseModel):
    echo: Any | None = Field(
        default=None,
        description="Эхо переданного body (или payload при формате {payload: ...}).",
    )
    sql: str | None = Field(
        default=None,
        description="Скомпилированный SQL (опционально, когда реализована компиляция).",
    )
