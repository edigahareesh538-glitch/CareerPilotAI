from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Any


class ChatSessionCreate(BaseModel):
    title: str | None = None


class ChatSessionRead(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    role: str
    content: str
    citations: list[dict[str, Any]] = []
    metadata: dict[str, Any] = {}


class ChatMessageRead(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    citations: list[dict[str, Any]]
    metadata: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True