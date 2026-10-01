import enum
import uuid
from sqlalchemy import Enum, ForeignKey, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class LearningPlanStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class LearningPlan(Base, TimestampMixin):
    __tablename__ = "learning_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_role: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[LearningPlanStatus] = mapped_column(
        Enum(LearningPlanStatus, native_enum=False), default=LearningPlanStatus.ACTIVE, nullable=False
    )
    plan_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    generated_at: Mapped[uuid.UUID] = mapped_column(nullable=False)  # We'll use this as a timestamp reference

    user: Mapped["User"] = relationship(back_populates="learning_plans")
    progress: Mapped[list["LearningProgress"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan"
    )


class LearningProgressStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class LearningProgress(Base, TimestampMixin):
    __tablename__ = "learning_progress"
    __table_args__ = (
        Index("ix_learning_progress_plan_skill", "plan_id", "skill_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("learning_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[LearningProgressStatus] = mapped_column(
        Enum(LearningProgressStatus, native_enum=False), default=LearningProgressStatus.NOT_STARTED, nullable=False
    )
    completed_at: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(nullable=True)

    plan: Mapped["LearningPlan"] = relationship(back_populates="progress")
    skill: Mapped["Skill"] = relationship()