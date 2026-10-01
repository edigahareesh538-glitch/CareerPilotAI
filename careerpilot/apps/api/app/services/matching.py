import uuid
from typing import Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector

from app.models.job import Job, JobSkill
from app.models.match import JobMatch
from app.models.resume import ResumeVersion
from app.models.skill import Skill
from app.models.user import User


async def get_user_skills(db: AsyncSession, user_id: uuid.UUID) -> list[Skill]:
    result = await db.execute(
        select(ResumeVersion)
        .join(ResumeVersion.resume)
        .where(ResumeVersion.is_active == True, ResumeVersion.resume.has(user_id=user_id))
        .order_by(ResumeVersion.version.desc())
        .limit(1)
    )
    resume_version = result.scalar_one_or_none()

    if not resume_version or not resume_version.parsed_json:
        return []

    skills_data = resume_version.parsed_json.get("candidate", {}).get("skills", [])
    if not skills_data:
        skills_data = resume_version.parsed_json.get("technical_skills", [])

    skills = []
    for skill_name in skills_data:
        result = await db.execute(select(Skill).where(Skill.name.ilike(skill_name)))
        skill = result.scalar_one_or_none()
        if skill:
            skills.append(skill)
        else:
            skill = Skill(name=skill_name, category="other")
            db.add(skill)
            await db.flush()
            skills.append(skill)

    return skills


async def get_user_experience_years(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(
        select(ResumeVersion)
        .join(ResumeVersion.resume)
        .where(ResumeVersion.is_active == True, ResumeVersion.resume.has(user_id=user_id))
        .order_by(ResumeVersion.version.desc())
        .limit(1)
    )
    resume_version = result.scalar_one_or_none()

    if not resume_version or not resume_version.parsed_json:
        return 0

    return resume_version.parsed_json.get("years_experience", 0)


async def get_user_embedding(db: AsyncSession, user_id: uuid.UUID) -> list[float] | None:
    result = await db.execute(
        select(ResumeVersion)
        .join(ResumeVersion.resume)
        .where(ResumeVersion.is_active == True, ResumeVersion.resume.has(user_id=user_id))
        .order_by(ResumeVersion.version.desc())
        .limit(1)
    )
    resume_version = result.scalar_one_or_none()

    if not resume_version or not resume_version.parsed_json:
        return None

    return resume_version.parsed_json.get("embedding")


def calculate_skill_match(user_skills: list[Skill], job_skills: list[JobSkill]) -> tuple[float, list[str], list[str]]:
    if not user_skills or not job_skills:
        return 0.0, [], [job_skill.skill.name for job_skill in job_skills]

    user_skill_names = {s.name.lower() for s in user_skills}
    job_skill_names = {js.skill.name.lower() for js in job_skills}

    matched = user_skill_names & job_skill_names
    missing = job_skill_names - user_skill_names

    if not job_skill_names:
        return 100.0, [], []

    score = (len(matched) / len(job_skill_names)) * 100
    return score, list(matched), list(missing)


def calculate_experience_match(user_years: int, job_level: str | None) -> float:
    if not job_level:
        return 50.0

    level_requirements = {
        "entry": 0,
        "junior": 1,
        "mid": 3,
        "senior": 5,
        "lead": 7,
        "principal": 10,
        "executive": 12,
    }

    required = level_requirements.get(job_level.lower(), 3)
    if user_years >= required:
        return 100.0
    elif user_years >= required * 0.7:
        return 75.0
    elif user_years >= required * 0.5:
        return 50.0
    else:
        return 25.0


async def calculate_embedding_similarity(db: AsyncSession, user_embedding: list[float] | None, job: Job) -> float:
    if not user_embedding or not job.embedding:
        return 50.0

    result = await db.execute(
        select(1 - Job.embedding.cosine_distance(user_embedding)).where(Job.id == job.id)
    )
    similarity = result.scalar_one_or_none()
    if similarity is not None:
        return float(similarity) * 100
    return 50.0


async def compute_match_score(db: AsyncSession, user_id: uuid.UUID, job: Job) -> tuple[float, dict[str, Any]]:
    user_skills = await get_user_skills(db, user_id)
    user_years = await get_user_experience_years(db, user_id)
    user_embedding = await get_user_embedding(db, user_id)

    job_skills_result = await db.execute(
        select(JobSkill).where(JobSkill.job_id == job.id).join(Skill)
    )
    job_skills = job_skills_result.scalars().all()

    skill_score, matched_skills, missing_skills = calculate_skill_match(user_skills, job_skills)
    experience_score = calculate_experience_match(user_years, job.experience_level.value if job.experience_level else None)
    embedding_score = await calculate_embedding_similarity(db, user_embedding, job)

    weights = {
        "skill": 0.5,
        "experience": 0.2,
        "embedding": 0.3,
    }

    final_score = (
        skill_score * weights["skill"] +
        experience_score * weights["experience"] +
        embedding_score * weights["embedding"]
    )

    explanation = {
        "skill_match": {
            "score": round(skill_score, 1),
            "matched": matched_skills,
            "missing": missing_skills,
        },
        "experience_match": {
            "score": round(experience_score, 1),
            "user_years": user_years,
            "required_level": job.experience_level.value if job.experience_level else "unknown",
        },
        "embedding_match": {
            "score": round(embedding_score, 1),
        },
        "weights": weights,
    }

    return round(final_score, 1), explanation


async def find_matches_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 20,
    min_score: float = 0.0,
) -> list[JobMatch]:
    user_skills = await get_user_skills(db, user_id)
    if not user_skills:
        return []

    skill_ids = [s.id for s in user_skills]

    result = await db.execute(
        select(Job)
        .join(JobSkill, JobSkill.job_id == Job.id)
        .where(JobSkill.skill_id.in_(skill_ids))
        .distinct()
        .limit(100)
    )
    candidate_jobs = result.scalars().all()

    matches = []
    for job in candidate_jobs:
        score, explanation = await compute_match_score(db, user_id, job)
        if score >= min_score:
            existing = await db.execute(
                select(JobMatch).where(JobMatch.user_id == user_id, JobMatch.job_id == job.id)
            )
            existing_match = existing.scalar_one_or_none()

            if existing_match:
                existing_match.score = score
                existing_match.explanation = explanation
                matches.append(existing_match)
            else:
                match = JobMatch(user_id=user_id, job_id=job.id, score=score, explanation=explanation)
                db.add(match)
                matches.append(match)

    matches.sort(key=lambda m: m.score, reverse=True)
    return matches[:limit]