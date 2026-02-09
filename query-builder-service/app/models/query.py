from pydantic import BaseModel, Field
from typing import List, Optional
from app.models.column import Column
from app.models.condition import Condition

class FromClause(BaseModel):
    table: str

class Query(BaseModel):
    type: str = "select"
    columns: List[Column]
    from_: FromClause = Field(..., alias="from")
    where: Optional[Condition] = None
    group_by: Optional[List[str]] = None
    having: Optional[Condition] = None
    order_by: Optional[List[dict]] = None
    limit: Optional[int] = None
