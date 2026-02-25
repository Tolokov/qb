from __future__ import annotations

from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient
from tests.cases import (
    SCENARIO_CASES,
    SCENARIO_PARAMETRIZE_ARGS,
    TEMPLATE_CASES,
    TEMPLATE_PARAMETRIZE_ARGS,
)

COMPILE_URL = "/api/v1/query/compile"


@pytest.mark.parametrize(TEMPLATE_PARAMETRIZE_ARGS, TEMPLATE_CASES)
def test_query_templates_compile_success(compile_client: TestClient, name: str, payload: Dict[str, Any]) -> None:
    """Все шаблоны QUERY_TEMPLATES должны успешно компилироваться и выполняться."""
    response = compile_client.post(COMPILE_URL, json=payload)
    if response.status_code == 503 and response.json().get("detail") == "Ibis/Spark unavailable":
        pytest.skip("Spark/Ibis is unavailable; skipping template compile tests")
    assert response.status_code == 200, f"{name}: {response.text}"
    data = response.json()
    assert data.get("sql"), f"{name}: sql is missing in response"
    assert isinstance(data.get("columns"), list), f"{name}: columns must be a list"


@pytest.mark.parametrize(SCENARIO_PARAMETRIZE_ARGS, SCENARIO_CASES)
def test_user_scenarios_compile_success(compile_client: TestClient, name: str, payload: Dict[str, Any]) -> None:
    """Все пользовательские сценарии USER_SCENARIO_TEMPLATES должны успешно выполняться на Spark."""
    response = compile_client.post(COMPILE_URL, json=payload)
    if response.status_code == 503 and response.json().get("detail") == "Ibis/Spark unavailable":
        pytest.skip("Spark/Ibis is unavailable; skipping user scenario tests")
    assert response.status_code == 200, f"{name}: {response.text}"
    data = response.json()
    assert data.get("sql"), f"{name}: sql is missing in response"
    assert isinstance(data.get("columns"), list), f"{name}: columns must be a list"

