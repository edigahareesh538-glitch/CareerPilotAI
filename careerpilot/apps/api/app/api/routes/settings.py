from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {
        "notifications": {
            "email": True,
            "push": True,
            "job_matches": True,
            "application_updates": True,
            "interview_reminders": True,
            "learning_milestones": True,
        },
        "privacy": {
            "profile_visibility": "private",
            "show_email": False,
            "show_location": True,
            "data_retention_days": 365,
        },
        "appearance": {
            "theme": "system",
            "compact_mode": False,
        },
    }


@router.patch("")
async def update_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {"message": "Settings updated", "settings": settings_data}


@router.patch("/auth/password")
async def update_password(
    password_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.auth import verify_password, hash_password
    
    if not current_user.password_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change password for OAuth accounts")
    
    if not verify_password(password_data["current_password"], current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    
    if password_data["new_password"] != password_data["confirm_password"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    
    if len(password_data["new_password"]) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
    
    current_user.password_hash = hash_password(password_data["new_password"])
    await db.commit()
    
    return {"message": "Password updated successfully"}


@router.delete("/auth/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account deleted successfully"}