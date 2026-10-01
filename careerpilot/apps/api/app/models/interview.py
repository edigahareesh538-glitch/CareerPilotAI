import enum
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class InterviewType(str, enum.Enum):
    HR = "hr"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    RESUME_BASED = "resume_based"
    JOB_SPECIFIC = "job_specific"
    CODING = "coding"
    MIXED = "mixed"


class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


class InterviewSession(Base, TimestampMixin):
    __tablename__ = "interview_sessions"
    __table_args__ = (
        Index("ix_interview_sessions_user_id_status", "user_id", "status"),
        Index("ix_interview_sessions_job_id", "job_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    type: Mapped[InterviewType] = mapped_column(
        Enum(InterviewType, native_enum=False), nullable=False
    )
    status: Mapped[InterviewStatus] = mapped_column(
        Enum(InterviewStatus, native_enum=False), default=InterviewStatus.SCHEDULED, nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(nullable=True)
    config: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    overall_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    user: Mapped["User"] = relationship(back_populates="interview_sessions")
    job: Mapped["Job"] = relationship(back_populates="interview_sessions")
    messages: Mapped[list["InterviewMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="InterviewMessage.timestamp"
    )
    scores: Mapped[list["InterviewScore"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class MessageRole(str, enum.Enum):
    SYSTEM = "system"
    INTERVIEWER = "interviewer"
    USER = "user"


class InterviewMessage(Base, TimestampMixin):
    __tablename__ = "interview_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole, native_enum=False), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    audio_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    session: Mapped["InterviewSession"] = relationship(back_populates="messages")


class InterviewScoreDimension(str, enum.Enum):
    TECHNICAL_KNOWLEDGE = "technical_knowledge"
    COMMUNICATION = "communication"
    ANSWER_RELEVANCE = "answer_relevance"
    PROBLEM_SOLVING = "problem_solving"
    CONFIDENCE = "confidence"
    STRUCTURE = "structure"
    CLARITY = "clarity"


class InterviewScore(Base, TimestampMixin):
    __tablename__ = "interview_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dimension: Mapped[InterviewScoreDimension] = mapped_column(
        Enum(InterviewScoreDimension, native_enum=False), nullable=False
    )
    score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    evidence: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    session: Mapped["InterviewSession"] = relationship(back_populates="scores")