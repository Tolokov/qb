# SQL Query Builder

Конвертер SQL запросов в spark

## Структура проекта

- **frontend** — веб-интерфейс на Next.js: drag-and-drop редактор запросов, превью и история.
- **backend** — сервис на FastAPI: принимает JSON-описание запроса и компилирует его в Hadoop-совместимый SQL.

## Запуск

**Фронтенд** (режим разработки):

```bash
cd frontend
pnpm install
pnpm dev
```

Приложение откроется по адресу [http://localhost:3000](http://localhost:3000).

**Бекенд** (API + Swagger):

```bash
cd backend
python -m venv venv
c или source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: [http://localhost:8000](http://localhost:8000)
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

**Pre-commit** (опционально, не обязателен для коммита):

Проверки перед коммитом для бекенда не включены по умолчанию. При желании можно запускать вручную:

```bash
cd backend
pip install -r requirements-dev.txt
pre-commit run --config backend/.pre-commit-config.yaml --all-files
```

Чтобы отключить автоматический запуск перед коммитом (если хуки уже ставились):

```bash
# из корня репо; если pre-commit ставился через venv бекенда:
backend\venv\Scripts\pre-commit.exe uninstall
# или после activate: pre-commit uninstall
```
