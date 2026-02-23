# Interacting with Spark tables through the backend

The backend exposes CRUD over Spark tables that mirror the frontend entities: **users**, **orders**, **products**. Tables are created automatically when the CRUD API is first used (via `SparkRepository`).

## Flow

1. **API** (`app.api.v1.routes.crud`) — Defines HTTP endpoints only and passes the request to the service via FastAPI `Depends(get_crud_service)`. No business logic in routes.

2. **Service** (`app.services.crud_service.CrudService`) — Validates the request (resource name, existence of entity for get/update/delete). On validation error returns `fastapi.HTTPException` with an appropriate status code (400, 404). Delegates all data access to the repository.

3. **Repository** (`app.repositories.spark_repository.SparkRepository`) — Single class that talks to Spark: list, get by id, create, update, delete for each table. Uses `app.spark_session.get_spark_session()` and ensures tables (and the `user_orders_mart` view) exist via `app.spark_tables.create_tables_and_view(spark)`.

## Tables and view

- **users** — id (int), name (string), created_at (timestamp), score (decimal), active (boolean).
- **orders** — id (int), user_id (int), notes (string), total (decimal), completed (boolean).
- **products** — id (int), name (string), price (decimal), created_at (timestamp), in_stock (boolean).

A view **user_orders_mart** joins users and orders (user_id, user_name, order_id, total, completed). It is created together with the tables; the CRUD API does not expose the view (only the three tables).

## Configuration

Spark is configured in `app.config.Settings`:

- `SPARK_MASTER` — e.g. `local[*]` (default) or `spark://spark-master:7077` when using the Docker cluster.
- `SPARK_WAREHOUSE_DIR` — Directory for the Spark SQL warehouse (default: `defaultLakehouse`).

See [SPARK_PYSPARK_VERSIONS.md](SPARK_PYSPARK_VERSIONS.md) for PySpark vs Apache Spark version compatibility.

## Запуск с реальным Spark

Бекенд работает нативно (`make run` или `make backend`). Чтобы CRUD ходил в Spark:

1. Поднять кластер: `docker compose up -d spark-master spark-worker`.
2. Установить JVM на хосте и задать переменные, например: `APP_SPARK_MASTER=spark://localhost:7077`, `APP_SPARK_WAREHOUSE_DIR=./defaultLakehouse` (каталог на хосте, при необходимости тот же, что смонтирован в контейнерах Spark).
3. Запустить бекенд. При первом обращении к CRUD создаются таблицы и заполняются начальными данными.

Если JVM нет, первый запрос к CRUD вернёт 503 с пояснением.
