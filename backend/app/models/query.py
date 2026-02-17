from dataclasses import dataclass
from typing import Any


@dataclass
class Query:
    payload: dict[str, Any] | None = None
