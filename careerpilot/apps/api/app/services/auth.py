from datetime import datetime, timedelta, timezone
from uuid import UUID
import secrets

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.user import User, OAuthAccount, OAuthProvider, UserRole

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.JWTError:
        return None


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


GUEST_EMAIL = "guest@careerpilot.local"
SEED_DEMO_EMAIL = "hareesh@example.com"  # created by `make db:seed`, see seed_demo.py


async def get_or_create_guest_user(db: AsyncSession) -> User:
    """Return the shared guest/demo account, creating it on first use.

    The app no longer has a login page — requests with no access token
    are treated as this guest user so every route keeps working without
    requiring anyone to sign in first. If the demo data has been seeded
    (`make db:seed`), we use that account so the dashboard is populated;
    otherwise we fall back to a blank guest account.
    """
    seeded_demo = await get_user_by_email(db, SEED_DEMO_EMAIL)
    if seeded_demo:
        return seeded_demo

    guest = await get_user_by_email(db, GUEST_EMAIL)
    if guest:
        return guest

    guest = User(
        email=GUEST_EMAIL,
        password_hash=None,
        full_name="Guest User",
        is_verified=True,
        is_active=True,
    )
    db.add(guest)
    await db.flush()
    await db.commit()
    await db.refresh(guest)
    return guest


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str | None = None,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        is_verified=False,
    )
    db.add(user)
    await db.flush()
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if not user or not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def update_last_login(db: AsyncSession, user: User) -> None:
    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()


async def get_oauth_account(
    db: AsyncSession, provider: OAuthProvider, provider_user_id: str
) -> OAuthAccount | None:
    result = await db.execute(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_user_id == provider_user_id,
        )
    )
    return result.scalar_one_or_none()


async def create_oauth_account(
    db: AsyncSession,
    user_id: UUID,
    provider: OAuthProvider,
    provider_user_id: str,
    access_token: str | None = None,
    refresh_token: str | None = None,
    expires_at: datetime | None = None,
    scope: str | None = None,
) -> OAuthAccount:
    oauth_account = OAuthAccount(
        user_id=user_id,
        provider=provider,
        provider_user_id=provider_user_id,
        access_token_enc=access_token,
        refresh_token_enc=refresh_token,
        expires_at=expires_at,
        scope=scope,
    )
    db.add(oauth_account)
    await db.flush()
    return oauth_account


def generate_state() -> str:
    return secrets.token_urlsafe(32)