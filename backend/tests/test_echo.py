import pytest

from tests.cases import ECHO_PARAMETRIZE_ARGS, ECHO_CASES
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
