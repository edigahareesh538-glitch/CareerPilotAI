from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.job import Job, JobSkill
from app.models.match import JobMatch, SavedJob
from app.models.skill import Skill
from app.schemas.job import JobMatchRead, JobRead, JobSearchParams
from app.services.auth import get_current_user
from app.services.jobs import discover_jobs
from app.services.matching import find_matches_for_user
from app.models.user import User

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/search", response_model=list[JobRead])
async def search_jobs(
    params: JobSearchParams = Depends(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Job).options(selectinload(Job.skills).selectinload(JobSkill.skill))

    if params.query:
        query = query.where(Job.title.ilike(f"%{params.query}%") | Job.description.ilike(f"%{params.query}%"))
    if params.location:
        query = query.where(Job.location.ilike(f"%{params.location}%"))
    if params.is_remote is not None:
        query = query.where(Job.is_remote == params.is_remote)
    if params.employment_type:
        query = query.where(Job.employment_type == params.employment_type)
    if params.experience_level:
        query = query.where(Job.experience_level == params.experience_level)
    if params.min_salary:
        query = query.where(Job.salary_max >= params.min_salary)

    query = query.order_by(Job.posted_at.desc().nullslast())
    offset = (params.page - 1) * params.page_size
    query = query.offset(offset).limit(params.page_size)

    result = await db.execute(query)
    jobs = result.scalars().all()

    return jobs


@router.get("/discover", response_model=list[JobRead])
async def discover_jobs_endpoint(
    provider: str = Query("mock", description="Job provider to use"),
    query: str = Query("", description="Search query"),
    location: str | None = Query(None, description="Location filter"),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    jobs = await discover_jobs(db, provider, query, location, limit)
    await db.commit()

    result = await db.execute(
        select(Job).options(selectinload(Job.skills).selectinload(JobSkill.skill)).where(Job.id.in_([j.id for j in jobs]))
    )
    return result.scalars().all()


@router.get("/matches", response_model=list[JobMatchRead])
async def get_job_matches(
    limit: int = Query(20, ge=1, le=100),
    min_score: float = Query(0.0, ge=0.0, le=100.0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    matches = await find_matches_for_user(db, current_user.id, limit, min_score)
    await db.commit()

    result = await db.execute(
        select(JobMatch)
        .options(selectinload(JobMatch.job).selectinload(Job.skills).selectinload(JobSkill.skill))
        .where(JobMatch.user_id == current_user.id)
        .order_by(JobMatch.score.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Job).options(selectinload(Job.skills).selectinload(JobSkill.skill)).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


@router.get("/{job_id}/match", response_model=JobMatchRead)
async def get_job_match(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JobMatch)
        .options(selectinload(JobMatch.job).selectinload(Job.skills).selectinload(JobSkill.skill))
        .where(JobMatch.user_id == current_user.id, JobMatch.job_id == job_id)
    )
    match = result.scalar_one_or_none()
    if not match:
        from app.services.matching import compute_match_score
        job_result = await db.execute(select(Job).where(Job.id == job_id))
        job = job_result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        score, explanation = await compute_match_score(db, current_user.id, job)
        match = JobMatch(user_id=current_user.id, job_id=job_id, score=score, explanation=explanation)
        db.add(match)
        await db.flush()

    return match


@router.post("/{job_id}/save", response_model=JobRead)
async def save_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    existing = await db.execute(
        select(SavedJob).where(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job already saved")

    saved = SavedJob(user_id=current_user.id, job_id=job_id)
    db.add(saved)
    await db.commit()

    return job


@router.delete("/{job_id}/save")
async def unsave_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedJob).where(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id)
    )
    saved = result.scalar_one_or_none()
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not saved")

    await db.delete(saved)
    await db.commit()
    return {"message": "Job unsaved"}


@router.get("/saved", response_model=list[JobRead])
async def get_saved_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Job)
        .join(SavedJob, SavedJob.job_id == Job.id)
        .options(selectinload(Job.skills).selectinload(JobSkill.skill))
        .where(SavedJob.user_id == current_user.id)
        .order_by(SavedJob.saved_at.desc())
    )
    return result.scalars().all()