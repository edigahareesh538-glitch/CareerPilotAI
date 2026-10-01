from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import init_db, close_db, engine
from app.api import router as api_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version="0.0.1",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health endpoints
@app.get("/health", tags=["health"])
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.get("/ready", tags=["health"])
async def ready() -> JSONResponse:
    try:
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        return JSONResponse({"status": "ready", "database": "connected"})
    except Exception as e:
        return JSONResponse(
            {"status": "not ready", "database": "disconnected", "error": str(e)},
            status_code=503,
        )


app.include_router(api_router, prefix="/api/v1")