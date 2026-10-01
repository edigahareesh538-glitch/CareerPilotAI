from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Any


class InterviewSessionCreate(BaseModel):
    job_id: UUID | None = None
    type: str
    config: dict[str, Any] = {}


class InterviewSessionRead(BaseModel):
    id: UUID
    user_id: UUID
    job_id: UUID | None = None
    type: str
    status: str
    started_at: datetime | None = None
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    config: dict[str, Any]
    overall_score: float | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewMessageRead(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    audio_key: str | None = None
    timestamp: datetime
    metadata: dict[str, Any]

    class Config:
        from_attributes = True


class InterviewScoreRead(BaseModel):
    id: UUID
    session_id: UUID
    dimension: str
    score: float
    evidence: dict[str, Any]

    class Config:
        from_attributes = True