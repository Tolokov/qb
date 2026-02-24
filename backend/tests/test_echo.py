import pytest

from app.dependencies import get_query_service
from app.services.query_service import QueryService
from tests.cases import ECHO_CASES, ECHO_PARAMETRIZE_ARGS
from tests.data import payload_simple

COMPILE_URL = "/api/v1/query/compile"


def test_echo_returns_payload(client):
    """
    Простой эхо-тест: запрос с payload возвращает 200 и в ответе echo совпадает с payload.

    Проверяет взаимодействие с фронтендом: тот же контракт (payload -> echo).
    """
    payload = payload_simple()
    response = client.post(COMPILE_URL, json={"payload": payload})
    assert response.status_code == 200
    data = response.json()
    assert "echo" in data
    assert data["echo"] == payload


@pytest.mark.parametrize(ECHO_PARAMETRIZE_ARGS, ECHO_CASES)
def test_echo_parametrized(client, payload):
    """Параметризованный эхо-тест: разные payload'ы возвращают свой echo."""
    response = client.post(COMPILE_URL, json={"payload": payload})
    assert response.status_code == 200
    assert response.json()["echo"] == payload


def test_compile_response_includes_sql_when_repo_provides_it(app, client):
    """
    QueryResponse поддерживает sql (контракт с frontend). Когда репозиторий возвращает sql,
    он попадает в ответ. Обратная совместимость: echo сохраняется.
    """

    class EchoAndSqlRepository:
        def execute(self, payload) -> dict:
            return {"echo": payload, "sql": "SELECT * FROM users"}

    app.dependency_overrides[get_query_service] = lambda: QueryService(
        repository=EchoAndSqlRepository()
    )
    try:
        payload = payload_simple()
        response = client.post(COMPILE_URL, json={"payload": payload})
        assert response.status_code == 200
        data = response.json()
        assert "echo" in data
        assert data["echo"] == payload
        assert "sql" in data
        assert data["sql"] == "SELECT * FROM users"
    finally:
        app.dependency_overrides.pop(get_query_service, None)


# ----- Any JSON body & backward compatibility -----


@pytest.mark.parametrize(
    "body,expected_echo",
    [
        ({"a": 1, "b": 2}, {"a": 1, "b": 2}),
        ([1, 2, 3], [1, 2, 3]),
        ("hello", "hello"),
        (42, 42),
        (3.14, 3.14),
        (True, True),
        (False, False),
        ([], []),
        ({}, {}),
    ],
    ids=["object", "array", "string", "int", "float", "bool_true", "bool_false", "empty_array", "empty_object"],
)
def test_compile_accepts_any_json_type(client, body, expected_echo):
    """POST /query/compile accepts any valid JSON type and echoes it."""
    response = client.post(COMPILE_URL, json=body)
    assert response.status_code == 200
    data = response.json()
    assert "echo" in data
    assert data["echo"] == expected_echo


def test_compile_accepts_null(client):
    """POST /query/compile accepts JSON null."""
    response = client.post(COMPILE_URL, content="null", headers={"Content-Type": "application/json"})
    assert response.status_code == 200
    assert response.json()["echo"] is None


def test_compile_invalid_json_returns_422(client):
    """POST /query/compile with invalid JSON returns 422."""
    response = client.post(
        COMPILE_URL,
        content="{invalid}",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422


def test_compile_backward_compat_payload_field(client):
    """When body has 'payload' key, payload value is used (backward compatibility)."""
    payload = {"from": "users", "select": ["*"]}
    response = client.post(COMPILE_URL, json={"payload": payload})
    assert response.status_code == 200
    assert response.json()["echo"] == payload


def test_compile_backward_compat_payload_with_other_keys(client):
    """When body has 'payload' among other keys, payload value is extracted."""
    payload = [1, 2, 3]
    response = client.post(COMPILE_URL, json={"payload": payload, "extra": "ignored"})
    assert response.status_code == 200
    assert response.json()["echo"] == payload


def test_compile_direct_object_vs_wrapped(client):
    """Direct object {"x":1} echoes as-is; {"payload":{"x":1}} echoes inner payload."""
    r1 = client.post(COMPILE_URL, json={"x": 1})
    assert r1.status_code == 200
    assert r1.json()["echo"] == {"x": 1}

    r2 = client.post(COMPILE_URL, json={"payload": {"x": 1}})
    assert r2.status_code == 200
    assert r2.json()["echo"] == {"x": 1}
