from typing import Any


def payload_empty() -> dict[str, Any]:
    return {}


def payload_simple() -> dict[str, Any]:
    return {
        "from": "users",
        "select": ["*"],
    }


def payload_with_order() -> dict[str, Any]:
    return {
        "from": "table",
        "select": ["*"],
        "orderBy": [{"column": "id", "direction": "ASC"}],
    }


def payload_with_columns() -> dict[str, Any]:
    return {
        "from": "users",
        "select": ["id", "name", "age"],
    }


def payload_with_filter() -> dict[str, Any]:
    return {
        "from": "users",
        "select": ["id", "name"],
        "where": [{"column": "active", "op": "eq", "value": True}],
    }


def make_payload(
    from_table: str = "users",
    select: list[str] | None = None,
    order_by: list[dict[str, Any]] | None = None,
    **extra: Any,
) -> dict[str, Any]:
    select = select if select is not None else ["*"]
    payload: dict[str, Any] = {"from": from_table, "select": select}
    if order_by is not None:
        payload["orderBy"] = order_by
    payload.update(extra)
    return payload


def echo_payloads() -> list[dict[str, Any]]:
    return [
        payload_empty(),
        payload_simple(),
        payload_with_order(),
        payload_with_columns(),
        payload_with_filter(),
    ]
