from typing import Optional

from pydantic import BaseModel


class Column(BaseModel):
    name: str
    aggregate: Optional[str] = None
    alias: Optional[str] = None
