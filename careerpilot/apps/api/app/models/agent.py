import enum
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class AgentName(str, enum.Enum):
    RESUME_ANALYZER = "resume_analyzer"
    JOB_DISCOVERY = "job_discovery"
    JOB_NORMALIZATION = "job_normalization"
    JOB_RESEARCH = "job_research"
    SKILL_MATCHING = "skill_matching"
    JOB_RANKING = "job_ranking"
    APPLICATION_PREPARATION = "application_preparation"
    APPLICATION_EXECUTION = "application_execution"
    CAREER_COACH = "career_coach"
    INTERVIEWER = "interviewer"
    ASSESSMENT = "assessment"
    NOTIFICATION = "notification"


class AgentActionStatus(str, enum.Enum):
    STARTED = "started"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING = "waiting"
    RETRYING = "retrying"


class AgentActivity(Base):
    __tablename__ = "agent_activities"
    __table_args__ = (
        Index("ix_agent_activities_user_id_created", "user_id", "created_at"),
        Index("ix_agent_activities_agent_status", "agent_name", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    agent_name: Mapped[AgentName] = mapped_column(Enum(AgentName, native_enum=False), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    input_ref: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_ref: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[AgentActionStatus] = mapped_column(
        Enum(AgentActionStatus, native_enum=False), nullable=False
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="agent_activities")