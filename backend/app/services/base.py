from typing import Protocol


class IQueryRepository(Protocol):
    def execute(self, payload: object) -> dict: ...
