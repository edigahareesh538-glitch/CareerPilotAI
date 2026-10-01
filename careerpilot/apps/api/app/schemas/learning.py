from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Any


class LearningPlanCreate(BaseModel):
    target_role: str
    plan_json: dict[str, Any]


class LearningPlanRead(BaseModel):
    id: UUID
    user_id: UUID
    target_role: str
    status: str
    plan_json: dict[str, Any]
    generated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class LearningProgressUpdate(BaseModel):
    status: str
    notes: str | None = None


class LearningProgressRead(BaseModel):
    id: UUID
    plan_id: UUID
    skill_id: UUID
    status: str
    completed_at: datetime | None = None
    notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True