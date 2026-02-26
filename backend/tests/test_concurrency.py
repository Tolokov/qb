from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi.testclient import TestClient


def _post_json_compile(client: TestClient, payload: dict) -> int:
    resp = client.post("/api/v1/query/compile", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert "sql" in body
    return resp.status_code


def _post_sql_compile(client: TestClient, sql: str) -> int:
    resp = client.post("/api/v1/query/compile-sql", json=sql)
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("sql") == sql
    return resp.status_code


def test_concurrent_json_compile_requests(client: TestClient) -> None:
    """Exercise concurrent JSON_SQL compilation via test-backed client."""
    payload = {
        "from": "table",
        "select": ["*"],
        "orderBy": [{"column": "id", "direction": "ASC"}],
    }
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(_post_json_compile, client, payload) for _ in range(16)]
        for fut in as_completed(futures):
            assert fut.result() == 200


def test_concurrent_sql_compile_requests(client: TestClient) -> None:
    """Exercise concurrent raw SQL execution via test-backed client."""
    sql = "SELECT 1 AS x"
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(_post_sql_compile, client, sql) for _ in range(16)]
        for fut in as_completed(futures):
            assert fut.result() == 200

