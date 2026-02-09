from pydantic import BaseModel
from typing import Optional

class Column(BaseModel):
    name: str
    aggregate: Optional[str] = None
    alias: Optional[str] = None
