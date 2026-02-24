from app.services.base import IQueryRepository


class _StubQueryBuilder:
    """Minimal stub for build(payload) -> query. QueryBuilder not yet implemented."""

    def build(self, payload: dict):
        return payload


class _StubSparkCodeRenderer:
    """Minimal stub for render(query) -> str. SparkCodeRenderer not yet implemented."""

    def render(self, query) -> str:
        return str(query) if query else ""


class MockQueryRepository(IQueryRepository):
    def __init__(
        self,
        query_builder: _StubQueryBuilder | None = None,
        renderer: _StubSparkCodeRenderer | None = None,
    ):
        self._builder = query_builder or _StubQueryBuilder()
        self._renderer = renderer or _StubSparkCodeRenderer()

    def execute(self, payload: dict) -> dict:
        if not isinstance(payload, dict):
            return {"sql": "", "spark": ""}
        query = self._builder.build(payload)
        code = self._renderer.render(query)
        return {"sql": code, "spark": code}
