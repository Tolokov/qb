# История изменений (Changelog)

Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).

---

## [Unreleased]

_Ещё не в релизе._

---

## [0.8.0]

### Добавлено
- Расширенная валидация JSON-запросов в `QueryService` для `from` / `select` / `groupBy` / `orderBy` / `aggregations` / `distinct` / `subqueries`.
- Бизнес-правила компиляции: при `groupBy` без агрегатов список `select` обязан совпадать с `groupBy`; конфликтующие направления сортировки (`ASC` и `DESC` для одной и той же колонки) отвергаются как `400`; любое наличие `having` явно запрещено с понятным текстом ошибки.
- Полный ответ `QueryResponse` для успешных запросов: `sql`, `columns`, `rows`, `row_count`, `truncated`, `execution_time_ms` (используются фронтендом для отображения результата и истории).
- Логирование тел всех запросов к `POST /api/v1/query/compile` в файл `logs/queries.jsonl` в корне репозитория (формат JSON Lines).
- Автотесты `tests/test_query_templates_scenarios.py`, проверяющие, что все фронтенд-шаблоны и пользовательские сценарии успешно компилируются и выполняются на реальном Spark (с пропуском при недоступности Spark/Ibis).

### Изменено
- Фактическим основным эндпоинтом для выполнения запросов является `POST /api/v1/query/compile` (исторические упоминания `/query/execute` в документации обновляются под новый путь по мере доработки).

---

## [0.6.0]

### Добавлено
- Healthcheck `GET /api/v1/health`: проверка бекенда, фронтенда и Spark-сессии.
- `make pre` — запуск pre-commit + pytest из корня проекта.
- Схемы `ComponentHealth`, `HealthResponse` для healthcheck-ответа.

### Изменено
- Все HTTP-статус-коды заменены на константы `fastapi.status`.
- `DuplicateIdError` заменён на `pydantic_core.PydanticCustomError`.
- `routes/backend.py` переименован в `routes/health.py`; тег Swagger `Backend` → `Health`.
- `routes/query.py` получил тег Swagger `Query` (было `default`).
- Healthcheck возвращает `"No errors"` вместо `null` при отсутствии проблем.
- `CrudService` рефакторинг: 15 разрозненных try/except заменены на `_repo_call`.
- `pre-commit`: Python 3.10 → 3.13, ruff-настройки перенесены в `[tool.ruff.lint]`.

### Удалено
- `memory_repository.py` и вся in-memory реализация.
- `exceptions.py` (`DuplicateIdError`).
- `Dockerfile`, `.dockerignore`.
- Неиспользуемая модель `QueryRequest` из `schemas/query.py`.
- Неиспользуемые импорты `ABC`, `abstractmethod`, `Query`, `Condition` из `services/base.py`.

### Исправлено
- Неотловленный HTTP 500 при обращении к удалённой/недоступной Spark-таблице.
- `LOCATION_ALREADY_EXISTS` при старте после сброса метастора Hive.
- `SparkRepository.__init__` вынесен внутрь `try/except` в `get_spark_repository`.

---

## [0.5.0]

- Локализация en/ru, переключатель в шапке, переводы и валидация.
- Favicon, плейсхолдеры, единый вид разделителей и высота панелей.
- Правила Cursor (Product Owner, Backend, Frontend), [AGENTS.md](AGENTS.md).

---

## [0.4.0]

- Makefile: `run`, `frontend`, `backend`, `setup`, автоустановка зависимостей бекенда.
- Шаблоны запросов и история на канвасе (сохранение/загрузка).
- Убраны тултипы.

---

## [0.3.0]

- Шаблоны Simple/Medium/Complex, группы блоков, SQL с подзапросами.
- Sidebar: поиск, свёрнутые категории по умолчанию; DnD и зоны сброса.
- Иконки блоков, Limit 10 по умолчанию; следы v0.dev удалены.

---

## [0.2.0]

- Каталог блоков в `components-catalog`.
- Бекенд: echo API `POST /api/v1/query/compile`, сервис и репозиторий.

---

## [0.1.0]

- Инициализация проекта.
- Бекенд: FastAPI, сервис, репозиторий, маршруты, схемы, тесты.
- Фронтенд: DnD-редактор, превью, библиотека компонентов.

---
