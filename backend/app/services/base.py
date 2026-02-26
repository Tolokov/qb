from typing import Protocol


class IQueryRepository(Protocol):
    def execute(self, payload: object) -> dict: ...

    def execute_sql(self, sql: str) -> dict: ...
