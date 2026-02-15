from typing import Any, List, Optional

from pydantic import BaseModel


class Condition(BaseModel):
    field: Optional[str] = None
    operator: str
    value: Optional[Any] = None
    conditions: Optional[List["Condition"]] = None


Condition.model_rebuild()
