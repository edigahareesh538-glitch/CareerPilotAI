import uuid
from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector

from app.models.job import Job, JobSkill, EmploymentType, ExperienceLevel
from app.models.skill import Skill
from app.services.job_providers import get_provider, RawJob


async def normalize_job(raw: RawJob, provider_name: str) -> dict[str, Any]:
    employment_type = None
    if raw.employment_type:
        try:
            employment_type = EmploymentType(raw.employment_type)
        except ValueError:
            pass

    experience_level = None
    if raw.experience_level:
        try:
            experience_level = ExperienceLevel(raw.experience_level)
        except ValueError:
            pass

    return {
        "provider": provider_name,
        "external_id": raw.external_id,
        "company": raw.company,
        "title": raw.title,
        "description": raw.description,
        "location": raw.location,
        "is_remote": raw.is_remote,
        "employment_type": employment_type,
        "experience_level": experience_level,
        "salary_min": raw.salary_min,
        "salary_max": raw.salary_max,
        "salary_currency": raw.salary_currency,
        "url": raw.url,
        "posted_at": raw.posted_at,
        "expires_at": raw.expires_at,
        "raw_data": raw.raw_data or {},
    }


async def extract_skills_from_text(text: str, db: AsyncSession) -> list[Skill]:
    skill_keywords = [
        "python", "javascript", "typescript", "java", "c++", "go", "rust", "sql",
        "pytorch", "tensorflow", "keras", "scikit-learn", "pandas", "numpy",
        "docker", "kubernetes", "aws", "gcp", "azure", "terraform",
        "fastapi", "django", "flask", "react", "vue", "next.js",
        "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
        "mlops", "mlflow", "kubeflow", "airflow", "prefect",
        "llm", "rag", "langchain", "llama-index", "vector database",
        "git", "ci/cd", "github actions", "gitlab ci",
    ]

    text_lower = text.lower()
    found_skills = []
    for keyword in skill_keywords:
        if keyword in text_lower:
            result = await db.execute(select(Skill).where(Skill.name.ilike(keyword)))
            skill = result.scalar_one_or_none()
            if not skill:
                skill = Skill(name=keyword.title(), category="programming")
                db.add(skill)
                await db.flush()
            found_skills.append(skill)
    return found_skills


async def upsert_job(db: AsyncSession, normalized: dict[str, Any]) -> Job:
    result = await db.execute(
        select(Job).where(Job.provider == normalized["provider"], Job.external_id == normalized["external_id"])
    )
    job = result.scalar_one_or_none()

    if job:
        for key, value in normalized.items():
            if key not in ("provider", "external_id") and value is not None:
                setattr(job, key, value)
    else:
        job = Job(**normalized)
        db.add(job)

    await db.flush()
    return job


async def link_job_skills(db: AsyncSession, job: Job, skills: list[Skill]) -> None:
    for skill in skills:
        result = await db.execute(
            select(JobSkill).where(JobSkill.job_id == job.id, JobSkill.skill_id == skill.id)
        )
        existing = result.scalar_one_or_none()
        if not existing:
            job_skill = JobSkill(job_id=job.id, skill_id=skill.id, weight=1.0)
            db.add(job_skill)

    await db.flush()


async def discover_jobs(db: AsyncSession, provider_name: str, query: str, location: str | None, limit: int) -> list[Job]:
    provider = get_provider(provider_name)
    if not provider:
        raise ValueError(f"Unknown provider: {provider_name}")

    raw_jobs = await provider.fetch_jobs(query, location, limit)
    jobs = []

    for raw in raw_jobs:
        normalized = await normalize_job(raw, provider_name)
        job = await upsert_job(db, normalized)
        skills = await extract_skills_from_text(raw.description, db)
        await link_job_skills(db, job, skills)
        jobs.append(job)

    return jobs