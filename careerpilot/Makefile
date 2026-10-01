.PHONY: help dev test lint typecheck db:migrate db:seed db:reset install

help:
	@echo "CareerPilot AI - Development Commands"
	@echo ""
	@echo "  make install       - Install all dependencies"
	@echo "  make dev           - Start all services (docker-compose)"
	@echo "  make dev:api       - Start API server only"
	@echo "  make dev:web       - Start frontend only"
	@echo "  make dev:worker    - Start Celery worker only"
	@echo "  make test          - Run all tests"
	@echo "  make test:api      - Run backend tests"
	@echo "  make test:web      - Run frontend tests"
	@echo "  make lint          - Run linters"
	@echo "  make typecheck     - Run type checkers"
	@echo "  make db:migrate    - Run database migrations"
	@echo "  make db:seed       - Seed demo data"
	@echo "  make db:reset      - Reset database and re-seed"
	@echo "  make build         - Build Docker images"
	@echo "  make clean         - Clean build artifacts"

install:
	cd apps/api && python -m venv .venv && .venv/bin/pip install -e ".[dev]"
	cd apps/web && pnpm install
	pnpm install

dev:
	docker-compose -f infra/docker-compose.yml up -d postgres redis minio
	sleep 5
	make db:migrate
	make db:seed
	docker-compose -f infra/docker-compose.yml up

dev:api:
	cd apps/api && .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev:web:
	cd apps/web && pnpm dev

dev:worker:
	cd apps/api && .venv/bin/celery -A app.workers.celery_app worker --loglevel=info --concurrency=4

test:
	make test:api
	make test:web

test:api:
	cd apps/api && .venv/bin/pytest -v

test:web:
	cd apps/web && pnpm test

lint:
	cd apps/api && .venv/bin/ruff check .
	cd apps/web && pnpm lint

typecheck:
	cd apps/api && .venv/bin/mypy .
	cd apps/web && pnpm typecheck

db:migrate:
	cd apps/api && .venv/bin/alembic upgrade head

db:seed:
	cd apps/api && .venv/bin/python seed_demo.py

db:reset:
	docker-compose -f infra/docker-compose.yml down -v
	docker-compose -f infra/docker-compose.yml up -d postgres redis minio
	sleep 5
	make db:migrate
	make db:seed

build:
	docker-compose -f infra/docker-compose.yml build

clean:
	docker-compose -f infra/docker-compose.yml down -v --remove-orphans
	rm -rf apps/api/.venv apps/api/__pycache__ apps/web/.next apps/web/node_modules
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true