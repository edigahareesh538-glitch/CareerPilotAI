from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Any


class ApplicationBase(BaseModel):
    job_id: UUID
    cover_letter: str | None = None
    application_answers: dict[str, Any] = {}
    notes: str | None = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    status: str | None = None
    cover_letter: str | None = None
    application_answers: dict[str, Any] | None = None
    notes: str | None = None


class ApplicationRead(ApplicationBase):
    id: UUID
    user_id: UUID
    resume_version_id: UUID | None = None
    status: str
    submitted_at: datetime | None = None
    external_application_id: str | None = None
    created_at: datetime
    job: "JobRead" | None = None

    class Config:
        from_attributes = True


class ApplicationEventRead(BaseModel):
    id: UUID
    application_id: UUID
    type: str
    payload: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


ApplicationRead.model_rebuild()