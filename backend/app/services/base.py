from abc import ABC, abstractmethod
from typing import Protocol

from app.models.condition import Condition
from app.models.query import Query


class IConditionBuilder(Protocol):
    def build(self, cond: Condition) -> str: ...


class IQueryCompiler(Protocol):
    def compile(self, query: Query) -> str: ...


class ConditionBuilderBase(ABC):
    @abstractmethod
    def build(self, cond: Condition) -> str: ...


class QueryCompilerBase(ABC):
    @abstractmethod
    def compile(self, query: Query) -> str: ...


class IQueryRepository(Protocol):
    def execute(self, payload: dict) -> str: ...
