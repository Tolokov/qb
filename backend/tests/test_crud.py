import json

COMPILE_URL = "/api/v1/query/compile"
USERS_URL = "/api/v1/users"
ORDERS_URL = "/api/v1/orders"
PRODUCTS_URL = "/api/v1/products"


def test_compile_unchanged(crud_client):
    """Existing /query/compile endpoint unchanged."""
    r = crud_client.post(COMPILE_URL, json={"payload": {"from": "users", "select": ["*"]}})
    assert r.status_code == 200
    assert "echo" in r.json()


# ----- Users -----


def test_users_list_empty(crud_client):
    r = crud_client.get(USERS_URL)
    assert r.status_code == 200
    assert r.json() == []


def test_users_create_and_get(crud_client):
    body = {"id": 1, "name": "Alice", "score": 10.5, "active": True}
    r = crud_client.post(USERS_URL, json=body)
    assert r.status_code == 201
    data = r.json()
    assert data["id"] == 1
    assert data["name"] == "Alice"

    r2 = crud_client.get(f"{USERS_URL}/1")
    assert r2.status_code == 200
    assert r2.json()["name"] == "Alice"


def test_users_get_404(crud_client):
    r = crud_client.get(f"{USERS_URL}/999")
    assert r.status_code == 404


def test_users_update(crud_client):
    crud_client.post(USERS_URL, json={"id": 1, "name": "Bob"}).raise_for_status()
    r = crud_client.put(f"{USERS_URL}/1", json={"name": "Robert"})
    assert r.status_code == 200
    assert r.json()["name"] == "Robert"


def test_users_update_404(crud_client):
    r = crud_client.put(f"{USERS_URL}/999", json={"name": "X"})
    assert r.status_code == 404


def test_users_delete(crud_client):
    crud_client.post(USERS_URL, json={"id": 1, "name": "Del"}).raise_for_status()
    r = crud_client.delete(f"{USERS_URL}/1")
    assert r.status_code == 204
    r2 = crud_client.get(f"{USERS_URL}/1")
    assert r2.status_code == 404


def test_users_delete_404(crud_client):
    r = crud_client.delete(f"{USERS_URL}/999")
    assert r.status_code == 404


def test_users_create_duplicate_id_409(crud_client):
    """Create with existing id returns 409 Conflict."""
    crud_client.post(USERS_URL, json={"id": 1, "name": "Alice"}).raise_for_status()
    r = crud_client.post(USERS_URL, json={"id": 1, "name": "Bob"})
    assert r.status_code == 409
    assert "already exists" in r.json().get("detail", "")


def test_users_create_decimal_datetime_serializable(crud_client):
    """Create/response with Decimal and datetime are JSON-serializable."""
    body = {
        "id": 1,
        "name": "Alice",
        "score": 10.5,
        "created_at": "2025-01-15T12:00:00",
        "active": True,
    }
    r = crud_client.post(USERS_URL, json=body)
    assert r.status_code == 201
    data = r.json()
    assert data["id"] == 1
    assert isinstance(data["score"], (int, float))
    assert isinstance(data.get("created_at"), (str, type(None)))
    json.dumps(data)


# ----- Orders -----


def test_orders_list_empty(crud_client):
    r = crud_client.get(ORDERS_URL)
    assert r.status_code == 200
    assert r.json() == []


def test_orders_create_and_list(crud_client):
    body = {"id": 1, "user_id": 10, "notes": "first", "total": 99.99, "completed": False}
    r = crud_client.post(ORDERS_URL, json=body)
    assert r.status_code == 201
    r2 = crud_client.get(ORDERS_URL)
    assert r2.status_code == 200
    assert len(r2.json()) == 1
    assert r2.json()[0]["notes"] == "first"


def test_orders_create_decimal_serializable(crud_client):
    """Create/response with Decimal total is JSON-serializable."""
    body = {"id": 1, "user_id": 1, "notes": "Order", "total": 99.99, "completed": False}
    r = crud_client.post(ORDERS_URL, json=body)
    assert r.status_code == 201
    data = r.json()
    assert isinstance(data["total"], (int, float))
    json.dumps(data)


def test_orders_get_404(crud_client):
    r = crud_client.get(f"{ORDERS_URL}/999")
    assert r.status_code == 404


def test_orders_update_and_delete(crud_client):
    crud_client.post(ORDERS_URL, json={"id": 1, "user_id": 1, "completed": False}).raise_for_status()
    crud_client.put(f"{ORDERS_URL}/1", json={"completed": True}).raise_for_status()
    r = crud_client.get(f"{ORDERS_URL}/1")
    assert r.json()["completed"] is True
    crud_client.delete(f"{ORDERS_URL}/1")
    assert crud_client.get(f"{ORDERS_URL}/1").status_code == 404


# ----- Products -----


def test_products_create_decimal_datetime_serializable(crud_client):
    """Create/response with Decimal and datetime are JSON-serializable (no validation errors)."""
    body = {
        "id": 1,
        "name": "Widget",
        "price": 12.99,
        "created_at": "2025-01-15T12:00:00",
        "in_stock": True,
    }
    r = crud_client.post(PRODUCTS_URL, json=body)
    assert r.status_code == 201
    data = r.json()
    assert data["id"] == 1
    assert data["name"] == "Widget"
    assert isinstance(data["price"], (int, float))
    assert isinstance(data.get("created_at"), (str, type(None)))
    # Verify response is valid JSON (no Decimal/datetime objects)
    json.dumps(data)


def test_products_create_duplicate_id_409(crud_client):
    """Create with existing id returns 409 Conflict."""
    crud_client.post(PRODUCTS_URL, json={"id": 1, "name": "Widget"}).raise_for_status()
    r = crud_client.post(PRODUCTS_URL, json={"id": 1, "name": "Gadget"})
    assert r.status_code == 409
    assert "already exists" in r.json().get("detail", "")


def test_products_create_get_update_delete(crud_client):
    r = crud_client.post(PRODUCTS_URL, json={"id": 1, "name": "Widget", "price": 12.5, "in_stock": True})
    assert r.status_code == 201
    assert crud_client.get(f"{PRODUCTS_URL}/1").json()["name"] == "Widget"
    crud_client.put(f"{PRODUCTS_URL}/1", json={"in_stock": False}).raise_for_status()
    assert crud_client.get(f"{PRODUCTS_URL}/1").json()["in_stock"] is False
    crud_client.delete(f"{PRODUCTS_URL}/1")
    assert crud_client.get(f"{PRODUCTS_URL}/1").status_code == 404
