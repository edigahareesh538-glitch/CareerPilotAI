from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Any


class ResumeBase(BaseModel):
    original_filename: str
    mime_type: str
    size_bytes: int


class ResumeCreate(ResumeBase):
    storage_key: str


class ResumeRead(ResumeBase):
    id: UUID
    user_id: UUID
    status: str
    error_message: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeVersionRead(BaseModel):
    id: UUID
    resume_id: UUID
    parsed_json: dict[str, Any]
    version: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True