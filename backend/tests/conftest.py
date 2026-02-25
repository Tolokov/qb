import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_crud_service, get_query_service
from app.main import create_app
from app.repositories.echo_repository import EchoQueryRepository
from app.services.crud_service import CrudService
from app.services.query_service import QueryService
from tests.fake_spark_repository import FakeSparkRepository


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


@pytest.fixture
def crud_client(app):
    """Client with CRUD backed by in-memory fake repo and query service using echo (no JVM)."""
    fake_repo = FakeSparkRepository()
    app.dependency_overrides[get_crud_service] = lambda: CrudService(repository=fake_repo)
    app.dependency_overrides[get_query_service] = lambda: QueryService(repository=EchoQueryRepository())
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_crud_service, None)
    app.dependency_overrides.pop(get_query_service, None)
