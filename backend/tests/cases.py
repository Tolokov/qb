import pytest

from tests.data import echo_payloads


def _echo_case(payload: dict, id_suffix: str = "") -> pytest.param:
    """Один кейс эхо: на вход payload, ожидаем в ответе echo == payload."""
    return pytest.param(payload, id=id_suffix or str(payload)[:50])


ECHO_PARAMETRIZE_ARGS = "payload"
ECHO_CASES = [_echo_case(p, f"echo_{i}") for i, p in enumerate(echo_payloads())]


def ids_for_echo_cases(cases: list) -> list[str]:
    """Генерирует id для parametrize по кейсам (короткие и читаемые)."""
    return [f"echo_{i}" for i in range(len(cases))]
