import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_query_service
from app.main import create_app
from app.repositories.echo_repository import EchoQueryRepository
from app.services.query_service import QueryService


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    """Client with query service backed by echo repository (no JVM needed)."""
    app.dependency_overrides[get_query_service] = lambda: QueryService(repository=EchoQueryRepository())
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_query_service, None)


@pytest.fixture(scope="module")
def compile_client():
    """Client with real QueryService/IbisRepository (uses actual Spark session)."""
    app = create_app()
    with TestClient(app) as c:
        yield c
