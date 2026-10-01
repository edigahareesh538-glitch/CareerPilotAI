from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.application import Application, ApplicationStatus, ApplicationEvent, ApplicationEventType
from app.models.job import Job
from app.models.resume import ResumeVersion
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationRead, ApplicationUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == application_data.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if application_data.resume_version_id:
        result = await db.execute(
            select(ResumeVersion)
            .join(ResumeVersion.resume)
            .where(ResumeVersion.id == application_data.resume_version_id, ResumeVersion.resume.has(user_id=current_user.id))
        )
        resume_version = result.scalar_one_or_none()
        if not resume_version:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume version not found")

    existing = await db.execute(
        select(Application).where(Application.user_id == current_user.id, Application.job_id == application_data.job_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application already exists for this job")

    application = Application(
        user_id=current_user.id,
        job_id=application_data.job_id,
        resume_version_id=application_data.resume_version_id,
        cover_letter=application_data.cover_letter,
        application_answers=application_data.application_answers,
        notes=application_data.notes,
        status=ApplicationStatus.SAVED,
    )
    db.add(application)
    await db.flush()

    event = ApplicationEvent(
        application_id=application.id,
        type=ApplicationEventType.CREATED,
        payload={"job_id": str(application_data.job_id)},
    )
    db.add(event)
    await db.commit()
    await db.refresh(application)

    return application


@router.get("", response_model=list[ApplicationRead])
async def list_applications(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Application)
        .options(selectinload(Application.job), selectinload(Application.resume_version))
        .where(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
    )

    if status_filter:
        statuses = status_filter.split(",")
        query = query.where(Application.status.in_(statuses))

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{application_id}", response_model=ApplicationRead)
async def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.job), selectinload(Application.resume_version))
        .where(Application.id == application_id, Application.user_id == current_user.id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


@router.patch("/{application_id}", response_model=ApplicationRead)
async def update_application(
    application_id: UUID,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id, Application.user_id == current_user.id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    old_status = application.status
    update_data = application_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(application, field, value)

    if "status" in update_data and update_data["status"] != old_status:
        event = ApplicationEvent(
            application_id=application.id,
            type=ApplicationEventType.STATUS_CHANGED,
            payload={"old_status": old_status, "new_status": update_data["status"]},
        )
        db.add(event)

        if update_data["status"] == ApplicationStatus.APPLIED.value:
            from datetime import datetime, timezone
            application.submitted_at = datetime.now(timezone.utc)
            event2 = ApplicationEvent(
                application_id=application.id,
                type=ApplicationEventType.SUBMITTED,
                payload={},
            )
            db.add(event2)

    await db.commit()
    await db.refresh(application)
    return application