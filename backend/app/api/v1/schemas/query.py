from typing import Any

from pydantic import BaseModel, Field


class QueryResponse(BaseModel):
    echo: Any | None = Field(
        default=None,
        description="Эхо переданного body (или payload при формате {payload: ...}).",
    )
    sql: str | None = Field(
        default=None,
        description="Скомпилированный SQL (опционально, когда реализована компиляция).",
    )
    columns: list[str] | None = Field(default=None, description="Имена колонок результата.")
    rows: list[list[Any]] | None = Field(default=None, description="Строки результата (список списков).")
    row_count: int | None = Field(default=None, description="Количество строк в ответе.")
    truncated: bool = Field(default=False, description="True если результат обрезан по MAX_ROWS.")
    execution_time_ms: int | None = Field(default=None, description="Время выполнения в мс.")
