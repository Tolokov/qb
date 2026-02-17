from dataclasses import dataclass
from typing import Any


@dataclass
class Condition:
    """Минимальная модель для совместимости с ConditionBuilderBase."""

    field: str | None = None
    operator: str | None = None
    value: Any = None
    conditions: list["Condition"] | None = None
