from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.skill import Skill
from app.models.user import User
from app.services.auth import get_current_user
from app.services.matching import get_user_skills

router = APIRouter(prefix="/skill-gaps", tags=["skill-gaps"])


@router.get("")
async def get_skill_gaps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_skills = await get_user_skills(db, current_user.id)
    user_skill_names = {s.name.lower() for s in user_skills}

    target_roles_result = await db.execute(
        select(User).where(User.id == current_user.id)
    )
    user = target_roles_result.scalar_one()
    
    target_roles = user.profile.target_roles if user.profile else []
    
    role_skills = {
        "ai engineer": ["python", "pytorch", "tensorflow", "mlops", "docker", "kubernetes", "aws", "llm", "rag", "vector database"],
        "ml engineer": ["python", "scikit-learn", "pandas", "sql", "aws", "airflow", "mlflow", "docker"],
        "data scientist": ["python", "sql", "pandas", "numpy", "scikit-learn", "statistics", "visualization"],
        "software engineer": ["python", "javascript", "sql", "docker", "kubernetes", "aws", "git", "ci/cd"],
    }

    all_required = set()
    for role in target_roles:
        role_lower = role.lower()
        for key, skills in role_skills.items():
            if key in role_lower:
                all_required.update(skills)

    gaps = []
    for skill_name in all_required:
        if skill_name not in user_skill_names:
            result = await db.execute(select(Skill).where(Skill.name.ilike(skill_name)))
            skill = result.scalar_one_or_none()
            if not skill:
                skill = Skill(name=skill_name.title(), category="other")
                db.add(skill)
                await db.flush()
            
            gaps.append({
                "skill": {"id": str(skill.id), "name": skill.name, "category": skill.category},
                "importance": 85,
                "user_level": 0,
                "gap": 85,
                "reason": f"Required for {', '.join(target_roles) or 'your target roles'}",
                "learning_resources": [
                    {"title": f"Learn {skill.name}", "url": f"https://example.com/learn/{skill.name.lower()}", "type": "course"},
                ],
            })

    return gaps