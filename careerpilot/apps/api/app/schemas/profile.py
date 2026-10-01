from typing import Any
from pydantic import BaseModel


class ProfileBase(BaseModel):
    headline: str | None = None
    location: str | None = None
    experience_level: str | None = None
    target_roles: list[str] = []
    target_locations: list[str] = []
    preferences: dict[str, Any] = {}
    bio: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None


class ProfileUpdate(ProfileBase):
    pass


class ProfileRead(ProfileBase):
    class Config:
        from_attributes = True