import os
import uuid
from pathlib import Path
from typing import BinaryIO

from minio import Minio
from minio.error import S3Error

from app.core.config import get_settings

settings = get_settings()

_client: Minio | None = None


def get_minio_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.STORAGE_ENDPOINT.replace("http://", "").replace("https://", ""),
            access_key=settings.STORAGE_ACCESS_KEY,
            secret_key=settings.STORAGE_SECRET_KEY,
            secure=settings.STORAGE_SECURE,
            region=settings.STORAGE_REGION,
        )
    return _client


async def ensure_bucket() -> None:
    client = get_minio_client()
    if not client.bucket_exists(settings.STORAGE_BUCKET):
        client.make_bucket(settings.STORAGE_BUCKET)


async def upload_file(file_obj: BinaryIO, filename: str, content_type: str) -> str:
    await ensure_bucket()
    client = get_minio_client()
    key = f"{uuid.uuid4()}_{filename}"
    file_obj.seek(0, os.SEEK_END)
    size = file_obj.tell()
    file_obj.seek(0)
    client.put_object(
        settings.STORAGE_BUCKET,
        key,
        file_obj,
        size,
        content_type=content_type,
    )
    return key


async def download_file(storage_key: str) -> Path:
    client = get_minio_client()
    local_path = Path(f"/tmp/{storage_key}")
    local_path.parent.mkdir(parents=True, exist_ok=True)
    client.fget_object(settings.STORAGE_BUCKET, storage_key, str(local_path))
    return local_path


async def delete_file(storage_key: str) -> None:
    client = get_minio_client()
    client.remove_object(settings.STORAGE_BUCKET, storage_key)


async def get_file_url(storage_key: str, expires: int = 3600) -> str:
    client = get_minio_client()
    return client.presigned_get_object(settings.STORAGE_BUCKET, storage_key, expires=expires)