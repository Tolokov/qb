from abc import ABC, abstractmethod
from typing import Protocol

from app.models.condition import Condition
from app.models.query import Query


class IQueryRepository(Protocol):
    def execute(self, payload: dict) -> dict: ...
