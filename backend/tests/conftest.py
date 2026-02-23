import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_crud_service
from app.main import create_app
from app.services.crud_service import CrudService
from tests.fake_spark_repository import FakeSparkRepository


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    return TestClient(app)


@pytest.fixture
def crud_client(app):
    """Client with CRUD backed by in-memory fake repo (no JVM)."""
    fake_repo = FakeSparkRepository()
    app.dependency_overrides[get_crud_service] = lambda: CrudService(repository=fake_repo)
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_crud_service, None)
