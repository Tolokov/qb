"""Tests for MockQueryRepository (import fix, basic execute)."""

from app.repositories.query_repository import MockQueryRepository


def test_mock_query_repository_execute():
    """MockQueryRepository executes without NameError (QueryBuilder/SparkCodeRenderer stubbed)."""
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
