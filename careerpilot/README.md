# CareerPilot AI

> Your AI Career Copilot — an AI‑native career operating system.

## What changed in this version

The **login page / login gate has been removed**. The site now works as an
**open website** — anyone who opens it lands straight in the dashboard,
no sign‑in required:

- The `/auth/login` page and the `AuthGuard` that redirected unauthenticated
  visitors to it have been deleted from the frontend.
- The backend no longer rejects requests with `401 Unauthorized` when no
  login token is present. Instead, every API route now resolves to a shared
  **guest account** automatically (see `get_or_create_guest_user` in
  `apps/api/app/services/auth.py`). If you've run `make db:seed`, that guest
  identity is the fully‑populated demo user (`hareesh@example.com`) so the
  dashboard shows real data immediately; otherwise a blank guest account is
  created on first request.
- Creating an account is now **optional**. The `/auth/register` page (and the
  underlying `/api/v1/auth/register` and `/api/v1/auth/login` endpoints) are
  still present and working, in case you want to re‑introduce per‑user
  accounts later, but nothing in the app requires you to use them.

If you want to fully re‑enable mandatory login later: re‑add a login
page/route, wrap `apps/web/src/app/(dashboard)/layout.tsx` in an auth guard
again, and change `get_current_user` in
`apps/api/app/api/routes/auth.py` to raise `401` instead of falling back to
`get_or_create_guest_user`.

---

## Project Type

This is a **monorepo** with two apps that run together:

| App | Tech | Purpose |
|---|---|---|
| `apps/web` | Next.js 14 (React, TypeScript, Tailwind) | The website / UI |
| `apps/api` | FastAPI (Python 3.11, SQLAlchemy, Celery) | The backend API, database, background jobs |

Supporting infrastructure (run via Docker): **PostgreSQL** (with the
`pgvector` extension), **Redis** (cache / Celery broker), **MinIO** (S3‑compatible
object storage for resumes/recordings).

---

## 1. Prerequisites

Install these on your machine before you start:

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org) | ≥ 20 | for the frontend |
| [pnpm](https://pnpm.io) | latest | `npm install -g pnpm` |
| [Python](https://www.python.org) | 3.11 | for the backend |
| [Docker](https://www.docker.com) + Docker Compose | latest | for Postgres, Redis, MinIO |
| `make` | any | optional, but the commands below assume it's available (Windows: use WSL or run the underlying commands directly) |

---

## 2. Installation

```bash
# 1. Enter the project
cd careerpilot

# 2. Copy the environment file and fill in values (see "Environment Variables" below)
cp .env.example .env

# 3. Install ALL dependencies (frontend + backend) in one step
make install
```

`make install` runs, in order:
```bash
cd apps/api && python -m venv .venv && .venv/bin/pip install -e ".[dev]"   # backend packages
cd apps/web && pnpm install                                                # frontend packages
pnpm install                                                               # root workspace tooling
```

If you don't have `make`, run those three commands manually.

**Backend packages** (installed via `pip install -e ".[dev]"`, defined in
`apps/api/pyproject.toml`): FastAPI, Uvicorn, SQLAlchemy 2.0, asyncpg,
Alembic, Redis, Celery, python-jose (JWT), passlib\[bcrypt] (password
hashing), pgvector, numpy, pdfplumber / python-docx (resume parsing),
authlib (OAuth), boto3 / minio (object storage), pytest/ruff/mypy (dev
tooling), and more — the full pinned list is in that file.

**Frontend packages** (installed via `pnpm install`, defined in
`apps/web/package.json`): Next.js 14, React 18, TanStack Query, Zustand,
socket.io-client, three.js, Radix UI primitives, Tailwind CSS, Zod,
TypeScript, Vitest, and more.

---

## 3. Start infrastructure (Postgres, Redis, MinIO)

```bash
pnpm db:up
```

This runs `docker compose -f infra/docker-compose.yml up -d postgres redis minio`.

## 4. Run database migrations and (optionally) seed demo data

```bash
make db:migrate    # creates all tables
make db:seed        # optional but recommended — populates the demo account
                     # with resume, jobs, matches, interviews, etc.
```

Because the login gate is gone, seeding is what makes the dashboard show
realistic data on first load instead of an empty state.

## 5. Run the app (3 terminals)

```bash
# Terminal 1 – API
cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 – Celery worker (background jobs: resume parsing, matching, etc.)
cd apps/api && source .venv/bin/activate && celery -A app.workers.celery_app worker -l info

# Terminal 3 – Frontend
cd apps/web && pnpm dev
```

Or, more simply, via the Makefile shortcuts (each in its own terminal):

```bash
make dev:api
make dev:worker
make dev:web
```

Then open:
- **http://localhost:3000** — the website (opens directly on the dashboard flow, no login)
- **http://localhost:8000/docs** — interactive OpenAPI/Swagger docs for the backend
- **http://localhost:8000/redoc** — ReDoc API reference

---

## 6. Environment Variables & API Keys

Copy `.env.example` to `.env` and fill in real values. Here is what every
variable is for and **which ones are actually required**:

### Required to run the app at all

| Variable | What it's for | Required? |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes — default works with `pnpm db:up` |
| `REDIS_URL` | Redis connection (cache, Celery, rate limiting) | Yes — default works with `pnpm db:up` |
| `SECRET_KEY` | Signs JWTs / sessions | Yes — set your own random string for anything beyond local testing |
| `STORAGE_ENDPOINT` / `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` / `STORAGE_BUCKET` | MinIO/S3 storage for uploaded resumes and interview recordings | Yes — defaults work with `pnpm db:up` (local MinIO) |
| `NEXT_PUBLIC_API_URL` | Tells the frontend where the backend API lives | Yes — `http://localhost:8000` for local dev |

None of these require an external account for local development — the
defaults in `.env.example` point at the Dockerized Postgres/Redis/MinIO
started by `pnpm db:up`.

### Optional — only needed for specific features

| Variable | What it's for | Required? |
|---|---|---|
| `NVIDIA_API_KEY` + `NVIDIA_BASE_URL` | Enables cloud LLM calls (resume analysis, AI career coach chat, interview question generation, etc.) via NVIDIA's hosted API | **Optional.** Get a key from [build.nvidia.com](https://build.nvidia.com). If left empty, the app is designed to fall back to a local model via `OLLAMA_BASE_URL`. |
| `OLLAMA_BASE_URL` | Local LLM fallback (no API key needed) | Optional — only if you're running [Ollama](https://ollama.com) locally instead of an external AI provider |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_REDIRECT_URI` | "Continue with Google" account creation on the (now-optional) register page | **Optional.** Only needed if you want to enable Google sign-up. Create credentials at [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials). |

Since the login gate has been removed, **the app is fully usable with zero
external API keys** — `NVIDIA_API_KEY` and the Google OAuth keys only unlock
AI‑powered features and optional account creation, respectively; everything
else runs against the local Docker infrastructure.

---

## Monorepo Layout

```
careerpilot/
├─ apps/
│  ├─ web/          # Next.js 14 (React, Tailwind, TS)
│  └─ api/          # FastAPI (Python 3.11, SQLAlchemy, Celery)
├─ packages/
│  └─ ui/           # shared React component library
├─ infra/
│  └─ docker-compose.yml
├─ .env.example
├─ Makefile
└─ README.md
```

## Core Modules (Implemented)

1. **Guest access (no login required)** – every request resolves to a shared demo/guest account automatically; optional email/password or Google sign-up is still available at `/auth/register`.
2. **Resume Upload & AI Analysis** – PDF/DOCX → structured profile with deterministic + LLM extraction.
3. **Job Discovery** – provider abstraction, normalization, deduplication, pgvector embeddings.
4. **Hybrid Matching Engine** – skills (Jaccard), experience (years), embeddings (cosine), location, role taxonomy.
5. **Application Prep & Tracker** – agents, status machine (saved → preparing → approval → applied → interview → offer/rejected).
6. **Interview Suite** – real-time WebSocket, STT/TTS streaming, Three.js 3D avatar with lip-sync, analytics.
7. **Career Coach Chat & Voice** – RAG over user data (resume, jobs, interviews, learning).
8. **Learning Roadmap & Assessments** – dynamic plans, MCQ/code evaluations, progress tracking.
9. **Skill Gap Analyzer** – compares user profile against target roles, explains why skills matter.
10. **Agent Activity Center** – transparent audit log of all AI agent actions.
11. **Observability** – structured JSON logs, health endpoints, Prometheus metrics, OpenTelemetry traces.

## Development Commands

```bash
make help          # Show all commands
make install       # Install all dependencies
make dev           # Start all services (docker-compose)
make dev:api       # Start API server only
make dev:web       # Start frontend only
make dev:worker    # Start Celery worker only
make test          # Run all tests
make test:api      # Run backend tests
make test:web      # Run frontend tests
make lint          # Run linters (ruff, eslint)
make typecheck     # Run type checkers (mypy, tsc)
make db:migrate    # Run database migrations
make db:seed       # Seed demo data (Hareesh profile — used as the guest identity)
make db:reset      # Reset database and re-seed
make build         # Build Docker images
make clean         # Clean build artifacts
```

## Key Features Demo Flow

1. **Open the site** → lands directly on the dashboard (no sign-in step)
2. **Upload Resume** → AI analyzes → structured profile with skills, experience, projects
3. **Dashboard** → Career Readiness score, top job matches, recent activity
4. **Jobs** → Discover (mock provider), Search, My Matches
5. **Job Detail** → Why this matches (skills, experience, embeddings), missing skills, interview prep
6. **Prepare Application** → AI generates cover letter, tailored resume, answers → approval
7. **Application Tracker** → Status timeline, events, reminders
8. **Interview Room** → WebSocket real-time, voice + text, 3D avatar lip-sync, dynamic follow-ups
9. **Interview Results** → Scores (technical, communication, problem-solving), strengths/weaknesses
10. **Career Coach** → Chat with RAG over your data, voice mode, generates 7-day plan
11. **Learning** → 4-week AI Engineer plan, progress tracking, resources
12. **Skill Gaps** → Priority matrix, missing skills with learning resources
13. **Agent Activity** → Real-time audit of all AI actions (resume parsing, job discovery, matching, etc.)

## API Documentation

- OpenAPI/Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `GET /health`, `GET /ready`

## Testing

```bash
# Frontend
cd apps/web && pnpm test

# Backend
cd apps/api && pytest -v

# Type checking
make typecheck

# Linting
make lint
```

## Deployment

```bash
# Build images
make build

# Deploy with Docker Compose (production)
docker-compose -f infra/docker-compose.yml -f infra/docker-compose.prod.yml up -d

# Kubernetes (Helm charts in infra/helm/, if present)
helm install careerpilot infra/helm/careerpilot
```

## Architecture Highlights

- **Monorepo** with pnpm workspaces (frontend) + pip/venv (backend)
- **PostgreSQL + pgvector** for relational data + semantic search
- **Redis** for caching, Celery queues, rate limiting, sessions
- **MinIO/S3** for object storage (resumes, audio recordings, avatars)
- **FastAPI** with async SQLAlchemy 2.0, Pydantic v2, Alembic migrations
- **Next.js 14 App Router** with Server Components, TanStack Query, Zustand
- **Three.js** for 3D interviewer avatar (lazy-loaded, 2D fallback)
- **WebSocket** for real-time interview (STT → LLM → TTS streaming)
- **Provider Abstraction** for job sources (mock, extensible for real APIs)
- **Agent Architecture** with explicit tools, permissions, audit logging
- **Open access by default**: no login gate; optional accounts, JWT-in-cookie auth infrastructure is still in place for future use

## License

MIT – see `LICENSE`.
