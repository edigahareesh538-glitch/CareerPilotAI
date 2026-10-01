from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.resume import Resume, ResumeVersion, ResumeStatus
from app.models.application import Application, ApplicationStatus
from app.models.interview import InterviewSession, InterviewStatus
from app.models.learning import LearningPlan, LearningPlanStatus
from app.services.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume_result = await db.execute(
        select(Resume).where(Resume.user_id == current_user.id, Resume.status == ResumeStatus.PARSED)
    )
    has_resume = resume_result.scalar_one_or_none() is not None

    applications_result = await db.execute(
        select(Application).where(Application.user_id == current_user.id)
    )
    applications = applications_result.scalars().all()

    interviews_result = await db.execute(
        select(InterviewSession).where(InterviewSession.user_id == current_user.id)
    )
    interviews = interviews_result.scalars().all()

    learning_result = await db.execute(
        select(LearningPlan).where(LearningPlan.user_id == current_user.id, LearningPlan.status == LearningPlanStatus.ACTIVE)
    )
    learning_plan = learning_result.scalar_one_or_none()

    career_readiness = 0
    if has_resume:
        career_readiness += 25
    if applications:
        career_readiness += 25
    if interviews:
        career_readiness += 25
    if learning_plan:
        career_readiness += 25

    resume_score = 86 if has_resume else 0
    skills_score = 74
    projects_score = 81
    interview_score = 69
    communication_score = 83
    job_match_score = 79

    return {
        "career_readiness": career_readiness,
        "resume_score": resume_score,
        "skills_score": skills_score,
        "projects_score": projects_score,
        "interview_score": interview_score,
        "communication_score": communication_score,
        "job_match_score": job_match_score,
        "has_resume": has_resume,
        "applications_count": len(applications),
        "interviews_count": len(interviews),
    }