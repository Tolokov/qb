from app.services.base import IQueryRepository


class EchoQueryRepository(IQueryRepository):

    def execute(self, payload: dict) -> dict:
        return {"echo": payload}
