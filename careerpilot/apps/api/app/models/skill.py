import uuid
from sqlalchemy import String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class SkillCategory(str):
    PROGRAMMING = "programming"
    FRAMEWORK = "framework"
    DATABASE = "database"
    CLOUD = "cloud"
    TOOL = "tool"
    AI_ML = "ai_ml"
    SOFT = "soft"
    LANGUAGE = "language"
    OTHER = "other"


class Skill(Base, TimestampMixin):
    __tablename__ = "skills"
    __table_args__ = (UniqueConstraint("name", name="uq_skill_name"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default=SkillCategory.OTHER)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    aliases: Mapped[list[str]] = mapped_column(
        nullable=False, default=list
    )  # JSON array stored as JSONB