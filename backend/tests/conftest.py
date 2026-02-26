import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_json_query_service
from app.main import create_app
from app.services.base import IQueryRepository
from app.services.query_service import QueryService


class TestQueryRepository(IQueryRepository):
    """Test-only repository that returns a minimal, deterministic result."""

    def execute(self, query: object) -> dict:
        sql_str = "SELECT 1 AS x;" if not isinstance(query, str) else f"{query.rstrip(';')};"
        return {
            "sql": sql_str,
            "columns": ["x"],
            "rows": [[1]],
            "row_count": 1,
            "truncated": False,
            "execution_time_ms": 0,
        }


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    """Client with query service backed by test repository (no JVM needed)."""
    app.dependency_overrides[get_json_query_service] = lambda: QueryService(repository=TestQueryRepository())
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_json_query_service, None)


@pytest.fixture(scope="module")
def compile_client():
    """Client with real JSON_SQL QueryService/IbisRepository (uses actual Spark session)."""
    app = create_app()
    with TestClient(app) as c:
        yield c
