# SQL Query Builder — запуск фронтенда и бекенда

.PHONY: frontend backend run setup setup-frontend setup-backend ensure-backend help

# Порты (для справки)
FRONTEND_PORT ?= 3000
BACKEND_PORT ?= 8000
SPARK_WAREHOUSE_DIR ?= $(CURDIR)/defaultLakehouse

help:
	@echo "Использование:"
	@echo "  make frontend   — запуск фронтенда (Next.js, порт $(FRONTEND_PORT))"
	@echo "  make backend    — запуск бекенда (при первом запуске сам выполнит setup-backend)"
	@echo "  make run        — запуск фронтенда и бекенда вместе"
	@echo "  make setup      — установка зависимостей (frontend + backend)"
	@echo "  make setup-frontend  — pnpm install в frontend/"
	@echo "  make setup-backend   — venv + pip install в backend/"
	@echo ""
	@echo "После make run: Ctrl+C останавливает оба процесса."

# Установка зависимостей
setup: setup-frontend setup-backend

setup-frontend:
	cd frontend && pnpm install

setup-backend:
	cd backend && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt

# Проверка venv бекенда; при отсутствии — запуск setup-backend
ensure-backend:
	@if [ ! -f backend/venv/bin/uvicorn ]; then $(MAKE) setup-backend; fi

# Запуск только фронтенда
frontend:
	cd frontend && pnpm dev

# Запуск только бекенда (при первом запуске автоматически выполняется setup-backend)
backend: ensure-backend
	cd backend && APP_SPARK_WAREHOUSE_DIR="$(SPARK_WAREHOUSE_DIR)" ./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port $(BACKEND_PORT)

# Запуск фронтенда и бекенда вместе (Ctrl+C останавливает оба)
run: ensure-backend
	@(cd backend && APP_SPARK_WAREHOUSE_DIR="$(SPARK_WAREHOUSE_DIR)" ./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port $(BACKEND_PORT)) & \
	(cd frontend && pnpm dev) & \
	wait
