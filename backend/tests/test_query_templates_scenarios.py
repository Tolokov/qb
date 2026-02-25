"""Тесты компиляции шаблонов и сценариев через реальный Ibis/Spark.

Чтобы тесты не помечались как SKIPPED, приложение должно уметь создать Spark-сессию:
- Локальный Spark (по умолчанию local[*]): в PATH должна быть Java (JAVA_HOME или java).
- Внешний кластер (например Docker): задайте APP_SPARK_MASTER=spark://localhost:7077
  и при необходимости APP_SPARK_WAREHOUSE_DIR (каталог, доступный мастеру и воркерам).

Пример: APP_SPARK_MASTER=spark://localhost:7077 APP_SPARK_WAREHOUSE_DIR=$(pwd)/defaultLakehouse
./venv/bin/pytest tests/test_query_templates_scenarios.py -v
"""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.cases import (
    SCENARIO_CASES,
    SCENARIO_PARAMETRIZE_ARGS,
    TEMPLATE_CASES,
    TEMPLATE_PARAMETRIZE_ARGS,
)

COMPILE_URL = "/api/v1/query/compile"

_SPARK_UNAVAILABLE_MSG = (
    "Spark/Ibis unavailable (backend returned 503)."
    "For local Spark ensure Java is in PATH; APP_SPARK_MASTER (e.g. spark://localhost:7077) and APP_SPARK_WAREHOUSE_DIR"
)


@pytest.mark.parametrize(TEMPLATE_PARAMETRIZE_ARGS, TEMPLATE_CASES)
def test_query_templates_compile_success(
    compile_client: TestClient, name: str, payload: dict[str, Any]
) -> None:
    """Все шаблоны QUERY_TEMPLATES должны успешно компилироваться и выполняться."""
    response = compile_client.post(COMPILE_URL, json=payload)
    if response.status_code == 503 and response.json().get("detail") == "Ibis/Spark unavailable":
        pytest.skip(_SPARK_UNAVAILABLE_MSG)
    assert response.status_code == 200, f"{name}: {response.text}"
    data = response.json()
    assert data.get("sql"), f"{name}: sql is missing in response"
    assert isinstance(data.get("columns"), list), f"{name}: columns must be a list"


@pytest.mark.parametrize(SCENARIO_PARAMETRIZE_ARGS, SCENARIO_CASES)
def test_user_scenarios_compile_success(
    compile_client: TestClient, name: str, payload: dict[str, Any]
) -> None:
    """Все пользовательские сценарии USER_SCENARIO_TEMPLATES должны успешно выполняться на Spark."""
    response = compile_client.post(COMPILE_URL, json=payload)
    if response.status_code == 503 and response.json().get("detail") == "Ibis/Spark unavailable":
        pytest.skip(_SPARK_UNAVAILABLE_MSG)
    assert response.status_code == 200, f"{name}: {response.text}"
    data = response.json()
    assert data.get("sql"), f"{name}: sql is missing in response"
    assert isinstance(data.get("columns"), list), f"{name}: columns must be a list"
