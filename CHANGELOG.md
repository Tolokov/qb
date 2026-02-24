# История изменений (Changelog)

Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).

---

## [Unreleased]

_Ещё не в релизе._

---

## [0.6.0]

### Добавлено
- CRUD API для Spark-таблиц: users, orders, products (GET/POST/PUT/DELETE).
- Healthcheck `GET /api/v1/health`: проверка бекенда, фронтенда и Spark-сессии.
- `make pre` — запуск pre-commit + pytest из корня проекта.
- Схемы `ComponentHealth`, `HealthResponse` для healthcheck-ответа.
- Глобальная обработка Spark-ошибок через `_repo_call` в `CrudService` (HTTP 503).
- Автовосстановление при рассинхроне метастора и файловой системы Spark.

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
