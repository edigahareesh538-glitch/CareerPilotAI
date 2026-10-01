from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.agent import AgentActivity, AgentName, AgentActionStatus
from app.models.user import User
from app.schemas.agent import AgentActivityRead
from app.services.auth import get_current_user

router = APIRouter(prefix="/agent-activities", tags=["agent-activities"])


@router.get("", response_model=list[AgentActivityRead])
async def list_agent_activities(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    agent_name: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(AgentActivity)
        .where(AgentActivity.user_id == current_user.id)
        .order_by(AgentActivity.created_at.desc())
    )

    if agent_name:
        query = query.where(AgentActivity.agent_name == AgentName(agent_name))
    if status_filter:
        query = query.where(AgentActivity.status == AgentActionStatus(status_filter))

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats")
async def get_agent_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentActivity).where(AgentActivity.user_id == current_user.id)
    )
    activities = result.scalars().all()

    stats = {}
    for activity in activities:
        agent = activity.agent_name.value
        if agent not in stats:
            stats[agent] = {"total": 0, "completed": 0, "failed": 0, "active": 0}
        stats[agent]["total"] += 1
        if activity.status == AgentActionStatus.COMPLETED:
            stats[agent]["completed"] += 1
        elif activity.status == AgentActionStatus.FAILED:
            stats[agent]["failed"] += 1
        elif activity.status in [AgentActionStatus.STARTED, AgentActionStatus.WAITING, AgentActionStatus.RETRYING]:
            stats[agent]["active"] += 1

    return stats