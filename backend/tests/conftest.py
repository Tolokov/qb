import pytest

from app.dependencies import get_query_repository
from app.main import create_app


@pytest.fixture
def app_with_settings():
    return create_app()


@pytest.fixture
def client(app_with_settings):
    from fastapi.testclient import TestClient

    return TestClient(app_with_settings)


@pytest.fixture
def mock_repository():
    from app.dependencies import get_query_builder, get_spark_renderer

    return get_query_repository(get_query_builder(), get_spark_renderer())
