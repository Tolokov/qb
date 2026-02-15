from dataclasses import dataclass, field
from typing import Any


@dataclass
class SparkQuery:
    table: str
    select: list[str | dict[str, str]] = field(default_factory=list)
    aggregations: list[dict[str, str]] = field(default_factory=list)
    where: dict[str, Any] | None = None
    group_by: list[str] = field(default_factory=list)
    having: list[str] | dict[str, Any] | None = None
    order_by: list[dict[str, str]] = field(default_factory=list)
    limit: int | None = None
    source_format: int = 2
