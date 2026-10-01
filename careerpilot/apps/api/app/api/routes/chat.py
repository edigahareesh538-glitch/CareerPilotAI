from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.schemas.chat import ChatSessionCreate, ChatSessionRead, ChatMessageCreate, ChatMessageRead
from app.services.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=ChatSessionRead, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = ChatSession(
        user_id=current_user.id,
        title=session_data.title,
    )
    db.add(session)
    await db.flush()

    if session_data.title:
        system_msg = ChatMessage(
            session_id=session.id,
            role="system",
            content=f"New chat session: {session_data.title}",
            citations=[],
            metadata={},
        )
        db.add(system_msg)

    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions", response_model=list[ChatSessionRead])
async def list_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=ChatSessionRead)
async def get_chat_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return session


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageRead)
async def send_chat_message(
    session_id: UUID,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    user_msg = ChatMessage(
        session_id=session_id,
        role=message_data.role,
        content=message_data.content,
        citations=message_data.citations,
        metadata=message_data.metadata,
    )
    db.add(user_msg)
    await db.flush()

    ai_response = f"I understand you're asking about: {message_data.content}. Let me provide a helpful response based on your career profile and goals."

    ai_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=ai_response,
        citations=[],
        metadata={},
    )
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)

    return ai_msg