from app.query_builder.query_builder import QueryBuilder
from app.query_builder.spark_renderer import SparkCodeRenderer
from app.services.base import IQueryRepository


class MockQueryRepository(IQueryRepository):
    def __init__(
        self,
        query_builder: QueryBuilder | None = None,
        renderer: SparkCodeRenderer | None = None,
    ):
        self._builder = query_builder or QueryBuilder()
        self._renderer = renderer or SparkCodeRenderer()

    def execute(self, payload: dict) -> str:
        if not isinstance(payload, dict):
            return ""
        query = self._builder.build(payload)
        return self._renderer.render(query)
