from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Any


class NotificationRead(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    priority: str
    title: str
    message: str
    payload: dict[str, Any]
    read_at: datetime | None = None
    action_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    read_at: datetime | None = None