from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.learning import LearningPlan, LearningProgress, LearningPlanStatus, LearningProgressStatus
from app.models.skill import Skill
from app.models.user import User
from app.schemas.learning import LearningPlanCreate, LearningPlanRead, LearningProgressUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/learning", tags=["learning"])


@router.post("/plans", response_model=LearningPlanRead, status_code=status.HTTP_201_CREATED)
async def create_learning_plan(
    plan_data: LearningPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(LearningPlan).where(LearningPlan.user_id == current_user.id, LearningPlan.status == LearningPlanStatus.ACTIVE)
    )
    active_plan = existing.scalar_one_or_none()
    if active_plan:
        active_plan.status = LearningPlanStatus.ARCHIVED

    from datetime import datetime, timezone
    plan = LearningPlan(
        user_id=current_user.id,
        target_role=plan_data.target_role,
        plan_json=plan_data.plan_json,
        status=LearningPlanStatus.ACTIVE,
        generated_at=datetime.now(timezone.utc),
    )
    db.add(plan)
    await db.flush()

    for skill_item in plan_data.plan_json.get("skills", []):
        skill_name = skill_item.get("skill") if isinstance(skill_item, dict) else skill_item
        result = await db.execute(select(Skill).where(Skill.name.ilike(skill_name)))
        skill = result.scalar_one_or_none()
        if skill:
            progress = LearningProgress(
                plan_id=plan.id,
                skill_id=skill.id,
                status=LearningProgressStatus.NOT_STARTED,
            )
            db.add(progress)

    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/plans", response_model=list[LearningPlanRead])
async def list_learning_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LearningPlan)
        .options(selectinload(LearningPlan.progress).selectinload(LearningProgress.skill))
        .where(LearningPlan.user_id == current_user.id)
        .order_by(LearningPlan.created_at.desc())
    )
    return result.scalars().all()


@router.get("/plans/{plan_id}", response_model=LearningPlanRead)
async def get_learning_plan(
    plan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LearningPlan)
        .options(selectinload(LearningPlan.progress).selectinload(LearningProgress.skill))
        .where(LearningPlan.id == plan_id, LearningPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning plan not found")
    return plan


@router.patch("/plans/{plan_id}/progress", response_model=LearningPlanRead)
async def update_learning_progress(
    plan_id: UUID,
    progress_data: LearningProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LearningPlan).where(LearningPlan.id == plan_id, LearningPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning plan not found")

    result = await db.execute(
        select(LearningProgress).where(LearningProgress.plan_id == plan_id, LearningProgress.skill_id == progress_data.skill_id)
    )
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progress entry not found")

    progress.status = LearningProgressStatus(progress_data.status)
    if progress_data.status == "completed":
        from datetime import datetime, timezone
        progress.completed_at = datetime.now(timezone.utc)
    progress.notes = progress_data.notes

    await db.commit()
    await db.refresh(plan)
    return plan