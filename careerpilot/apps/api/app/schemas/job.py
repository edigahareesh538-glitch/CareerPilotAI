from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Any


class JobSkillRead(BaseModel):
    id: UUID
    name: str
    category: str
    weight: float

    class Config:
        from_attributes = True


class JobRead(BaseModel):
    id: UUID
    provider: str
    external_id: str
    company: str
    title: str
    description: str
    location: str | None = None
    is_remote: bool
    employment_type: str | None = None
    experience_level: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str
    url: str
    posted_at: datetime | None = None
    expires_at: datetime | None = None
    skills: list[JobSkillRead] = []

    class Config:
        from_attributes = True


class JobMatchRead(BaseModel):
    id: UUID
    job: JobRead
    score: float
    explanation: dict[str, Any]

    class Config:
        from_attributes = True


class JobSearchParams(BaseModel):
    query: str | None = None
    location: str | None = None
    is_remote: bool | None = None
    employment_type: str | None = None
    experience_level: str | None = None
    min_salary: int | None = None
    skills: list[str] | None = None
    page: int = 1
    page_size: int = 20
    min_match_score: float | None = None