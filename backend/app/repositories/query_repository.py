from app.services.base import IQueryRepository


class MockQueryRepository(IQueryRepository):
    def __init__(
        self,
        query_builder: QueryBuilder | None = None,
        renderer: SparkCodeRenderer | None = None,
    ):
        self._builder = query_builder or QueryBuilder()
        self._renderer = renderer or SparkCodeRenderer()

    def execute(self, payload: dict) -> dict:
        if not isinstance(payload, dict):
            return {"sql": "", "spark": ""}
        query = self._builder.build(payload)
        code = self._renderer.render(query)
        return {"sql": code, "spark": code}
