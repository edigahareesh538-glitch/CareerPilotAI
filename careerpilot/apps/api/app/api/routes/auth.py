from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.schemas.user import UserCreate, UserRead, Token
from app.services.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    create_user,
    decode_token,
    get_or_create_guest_user,
    get_user_by_email,
    get_user_by_id,
    update_last_login,
)
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", httponly=True, secure=not settings.DEBUG, samesite="lax")
    response.delete_cookie("refresh_token", httponly=True, secure=not settings.DEBUG, samesite="lax")


async def get_current_user(
    response: Response,
    db: AsyncSession = Depends(get_db),
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> User:
    # There is no login page anymore, so requests with no access token are
    # treated as the shared guest account rather than being rejected. This
    # keeps every route below working without requiring anyone to sign in.
    if not access_token:
        if refresh_token:
            refresh_payload = decode_token(refresh_token)
            if refresh_payload and refresh_payload.get("type") == "refresh":
                user_id = UUID(refresh_payload["sub"])
                user = await get_user_by_id(db, user_id)
                if user and user.is_active:
                    new_access = create_access_token(user.id)
                    new_refresh = create_refresh_token(user.id)
                    set_auth_cookies(response, new_access, new_refresh)
                    return user
        return await get_or_create_guest_user(db)

    payload = decode_token(access_token)
    if not payload or payload.get("type") != "access":
        if refresh_token:
            refresh_payload = decode_token(refresh_token)
            if refresh_payload and refresh_payload.get("type") == "refresh":
                user_id = UUID(refresh_payload["sub"])
                user = await get_user_by_id(db, user_id)
                if user and user.is_active:
                    new_access = create_access_token(user.id)
                    new_refresh = create_refresh_token(user.id)
                    set_auth_cookies(response, new_access, new_refresh)
                    return user
        return await get_or_create_guest_user(db)

    user_id = UUID(payload["sub"])
    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:
        return await get_or_create_guest_user(db)

    return user


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    existing = await get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = await create_user(db, user_data.email, user_data.password, user_data.full_name)
    await db.commit()

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    set_auth_cookies(response, access_token, refresh_token)

    return user


@router.post("/login", response_model=UserRead)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    await update_last_login(db, user)
    await db.commit()

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    set_auth_cookies(response, access_token, refresh_token)

    return user


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=Token)
async def refresh(
    response: Response,
    refresh_token: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = UUID(payload["sub"])
    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)
    set_auth_cookies(response, new_access, new_refresh)

    return Token(access_token=new_access, refresh_token=new_refresh)


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user