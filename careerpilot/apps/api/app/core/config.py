from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "CareerPilot AI"
    ENV: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/careerpilot"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Object storage (MinIO / S3)
    STORAGE_ENDPOINT: str = "http://localhost:9000"
    STORAGE_ACCESS_KEY: str = "minioadmin"
    STORAGE_SECRET_KEY: str = "minioadmin"
    STORAGE_BUCKET: str = "careerpilot"
    STORAGE_REGION: str = "us-east-1"
    STORAGE_SECURE: bool = False

    # AI Providers (NVIDIA or local fallbacks)
    NVIDIA_API_KEY: str | None = None
    NVIDIA_BASE_URL: str | None = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Google OAuth
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback/google"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Rate limiting
    RATE_LIMIT_DEFAULT: str = "100/minute"

@lru_cache
def get_settings() -> Settings:
    return Settings()