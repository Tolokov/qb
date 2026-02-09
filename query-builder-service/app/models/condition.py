from pydantic import BaseModel
from typing import Optional, Any, List

class Condition(BaseModel):
    field: Optional[str] = None
    operator: str
    value: Optional[Any] = None
    conditions: Optional[List["Condition"]] = None

Condition.model_rebuild()
