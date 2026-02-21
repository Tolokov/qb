# SQL Query Builder — запуск фронтенда и бекенда

.PHONY: frontend backend run setup setup-frontend setup-backend help

# Порты (для справки)
FRONTEND_PORT ?= 3000
BACKEND_PORT ?= 8000

help:
	@echo "Использование:"
	@echo "  make frontend   — запуск фронтенда (Next.js, порт $(FRONTEND_PORT))"
	@echo "  make backend    — запуск бекенда (FastAPI, порт $(BACKEND_PORT))"
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

# Запуск только фронтенда
frontend:
	cd frontend && pnpm dev

# Запуск только бекенда (использует venv, если есть)
backend:
	@if [ -f backend/venv/bin/uvicorn ]; then \
		cd backend && ./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port $(BACKEND_PORT); \
	else \
		echo "Сначала выполните: make setup-backend"; \
		exit 1; \
	fi

# Запуск фронтенда и бекенда вместе (Ctrl+C останавливает оба)
run:
	@if [ ! -f backend/venv/bin/uvicorn ]; then \
		echo "Сначала выполните: make setup-backend"; exit 1; \
	fi
	@(cd backend && ./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port $(BACKEND_PORT)) & \
	(cd frontend && pnpm dev) & \
	wait
