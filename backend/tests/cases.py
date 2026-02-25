import pytest

from tests.data import ECHO_PAYLOADS, SCENARIO_PAYLOADS, TEMPLATE_PAYLOADS


def _echo_case(payload: dict, id_suffix: str = "") -> pytest.param:
    """Один кейс эхо: на вход payload, ожидаем в ответе echo == payload."""
    return pytest.param(payload, id=id_suffix or str(payload)[:50])


ECHO_PARAMETRIZE_ARGS = "payload"
ECHO_CASES = [_echo_case(p, f"echo_{i}") for i, p in enumerate(ECHO_PAYLOADS)]


def ids_for_echo_cases(cases: list) -> list[str]:
    """Генерирует id для parametrize по кейсам (короткие и читаемые)."""
    return [f"echo_{i}" for i in range(len(cases))]


TEMPLATE_PARAMETRIZE_ARGS = "name,payload"
TEMPLATE_CASES = list(TEMPLATE_PAYLOADS.items())

SCENARIO_PARAMETRIZE_ARGS = "name,payload"
SCENARIO_CASES = list(SCENARIO_PAYLOADS.items())
