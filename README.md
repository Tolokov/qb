# SQL Query Builder (QB)

Конвертер SQL-запросов в Spark: веб-интерфейс для визуальной сборки запроса и бекенд для компиляции в Hadoop-совместимый SQL.

## Содержание

- [Структура проекта](#структура-проекта)
- [Сборка и запуск (Makefile)](#сборка-и-запуск-makefile)
- [Запуск вручную](#запуск-вручную)
- [Документация](#документация)
- [Pre-commit](#pre-commit)

---

## Структура проекта

| Часть      | Описание |
|-----------|----------|
| **frontend** | Веб-интерфейс на Next.js: drag-and-drop редактор запросов, превью (JSON/SQL), история, библиотека блоков. |
| **backend**  | Сервис на FastAPI: принимает JSON-описание запроса, компилирует в Hadoop-совместимый SQL. |

---

## Сборка и запуск (Makefile)

Из корня репозитория все команды запуска и установки выполняются через Makefile.

### Цели Makefile

Полный список целей — в [Makefile](Makefile). Кратко по командам:

| Команда | Описание |
|--------|----------|
| `make help` | Справка по целям Makefile. |
| `make setup` | Установка зависимостей (frontend + backend). |
| `make setup-frontend` | `pnpm install` в `frontend/`. |
| `make setup-backend` | Создание venv и `pip install -r requirements.txt` в `backend/`. |
| `make frontend` | Запуск фронтенда (Next.js, порт 3000). |
| `make backend` | Запуск бекенда (порт 8000); при первом запуске сам выполнит `setup-backend`. |
| `make run` | Одновременный запуск фронтенда и бекенда; остановка — Ctrl+C. |

После `make run`:

- Фронтенд: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8000](http://localhost:8000)
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Запуск вручную

Если не используете Makefile:

**Фронтенд:**

```bash
cd frontend
pnpm install
pnpm dev
```

Приложение: [http://localhost:3000](http://localhost:3000).

**Бекенд:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: [http://localhost:8000](http://localhost:8000)
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

**CRUD по таблицам Spark:** поднять кластер `docker compose up -d spark-master spark-worker`, на хосте нужна JVM и переменные окружения (см. [backend/docs/SPARK_TABLES.md](backend/docs/SPARK_TABLES.md)).

---

## Документация

| Документ | Описание |
|----------|----------|
| [AGENTS.md](AGENTS.md) | Роли агентов в проекте (Product Owner, Backend, Frontend) и когда какую правило подключать. |
| [CHANGELOG.md](CHANGELOG.md) | История изменений по версиям: что добавлено, изменено и исправлено. |
| [backend/docs/SPARK_TABLES.md](backend/docs/SPARK_TABLES.md) | Взаимодействие с таблицами Spark через бекенд (API → Service → Repository). |
| [backend/docs/SPARK_PYSPARK_VERSIONS.md](backend/docs/SPARK_PYSPARK_VERSIONS.md) | Совместимость версий PySpark и Apache Spark. |
| [Makefile](Makefile) | Цели для сборки и запуска (см. также [раздел выше](#сборка-и-запуск-makefile)). |

---

## Pre-commit

Проверки перед коммитом для бекенда не включены по умолчанию. Запуск вручную:

```bash
cd backend
pip install -r requirements-dev.txt
pre-commit run --config backend/.pre-commit-config.yaml --all-files
```

Отключение хуков (если ставились):

```bash
# из корня репо (если pre-commit ставился через venv бекенда):
pre-commit uninstall
# или после activate в backend: pre-commit uninstall
```
