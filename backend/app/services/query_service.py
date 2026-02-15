from app.services.base import IQueryRepository


class QueryService:
    def __init__(self, repository: IQueryRepository) -> None:
        self._repository = repository

    def execute(self, payload: dict) -> dict:
        spark_code = self._repository.execute(payload)
        return {"sql": spark_code, "spark": spark_code}
