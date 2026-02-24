from typing import Any

from app.services.base import IQueryRepository


class EchoQueryRepository(IQueryRepository):

    def execute(self, payload: Any) -> dict[str, Any]:
        return {"echo": payload}
