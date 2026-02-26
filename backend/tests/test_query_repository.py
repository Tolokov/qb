"""Tests for test-only MockQueryRepository (local to tests)."""

from app.services.base import IQueryRepository


class _StubQueryBuilder:
    """Minimal stub for build(payload) -> query. QueryBuilder not yet implemented."""

    def build(self, payload: dict):
        return payload


class MockQueryRepository(IQueryRepository):
    """Test-only mock repository, lives in tests only."""

    def __init__(self, query_builder: _StubQueryBuilder | None = None):
        self._builder = query_builder or _StubQueryBuilder()

    def execute(self, payload: dict) -> dict:
        if not isinstance(payload, dict):
            return {"sql": "", "spark": ""}
        query = self._builder.build(payload)
        code = str(query) if query else ""
        return {"sql": code, "spark": code}


def test_mock_query_repository_execute():
    """MockQueryRepository executes without NameError (QueryBuilder stubbed)."""
    repo = MockQueryRepository()
    result = repo.execute({"from": "users", "select": ["*"]})
    assert isinstance(result, dict)
    assert "sql" in result
    assert "spark" in result


def test_mock_query_repository_execute_empty():
    """MockQueryRepository returns empty sql/spark for non-dict."""
    repo = MockQueryRepository()
    result = repo.execute("invalid")
    assert result == {"sql": "", "spark": ""}
