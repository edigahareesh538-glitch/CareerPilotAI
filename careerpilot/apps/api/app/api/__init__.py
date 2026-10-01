from fastapi import APIRouter

from app.api.routes import auth, resumes, jobs, profile, interviews, applications, learning, chat, agent_activities, settings, skill_gaps, dashboard

router = APIRouter()
router.include_router(auth.router)
router.include_router(resumes.router)
router.include_router(jobs.router)
router.include_router(profile.router)
router.include_router(interviews.router)
router.include_router(applications.router)
router.include_router(learning.router)
router.include_router(chat.router)
router.include_router(agent_activities.router)
router.include_router(settings.router)
router.include_router(skill_gaps.router)
router.include_router(dashboard.router)

@router.get("/ping")
async def ping():
    return {"message": "pong"}