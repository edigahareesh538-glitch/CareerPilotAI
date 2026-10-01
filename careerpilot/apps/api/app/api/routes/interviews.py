from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.interview import InterviewSession, InterviewMessage, InterviewType, InterviewStatus, MessageRole
from app.models.job import Job
from app.models.user import User
from app.schemas.interview import InterviewSessionCreate, InterviewSessionRead, InterviewMessageRead
from app.services.auth import get_current_user

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.post("", response_model=InterviewSessionRead, status_code=status.HTTP_201_CREATED)
async def create_interview(
    interview_data: InterviewSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if interview_data.job_id:
        result = await db.execute(select(Job).where(Job.id == interview_data.job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    session = InterviewSession(
        user_id=current_user.id,
        job_id=interview_data.job_id,
        type=InterviewType(interview_data.type),
        status=InterviewStatus.SCHEDULED,
        config=interview_data.config,
    )
    db.add(session)
    await db.flush()

    system_msg = InterviewMessage(
        session_id=session.id,
        role=MessageRole.SYSTEM,
        content=f"Starting {interview_data.type} interview. The AI interviewer will begin shortly.",
        timestamp=session.created_at,
    )
    db.add(system_msg)
    await db.commit()
    await db.refresh(session)

    return session


@router.get("", response_model=list[InterviewSessionRead])
async def list_interviews(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .options(selectinload(InterviewSession.job))
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/{interview_id}", response_model=InterviewSessionRead)
async def get_interview(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .options(selectinload(InterviewSession.job))
        .where(InterviewSession.id == interview_id, InterviewSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return session


@router.get("/{interview_id}/messages", response_model=list[InterviewMessageRead])
async def get_interview_messages(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == interview_id, InterviewSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    result = await db.execute(
        select(InterviewMessage)
        .where(InterviewMessage.session_id == interview_id)
        .order_by(InterviewMessage.timestamp)
    )
    return result.scalars().all()


@router.post("/{interview_id}/end", response_model=InterviewSessionRead)
async def end_interview(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == interview_id, InterviewSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    if session.status in [InterviewStatus.COMPLETED, InterviewStatus.CANCELLED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview already ended")

    from datetime import datetime, timezone
    session.status = InterviewStatus.COMPLETED
    session.ended_at = datetime.now(timezone.utc)
    if session.started_at:
        session.duration_seconds = int((session.ended_at - session.started_at).total_seconds())

    await db.commit()
    await db.refresh(session)
    return session


@router.websocket("/{interview_id}/ws")
async def interview_websocket(
    websocket: WebSocket,
    interview_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    await websocket.accept()

    result = await db.execute(select(InterviewSession).where(InterviewSession.id == interview_id))
    session = result.scalar_one_or_none()
    if not session:
        await websocket.close(code=4004, reason="Interview not found")
        return

    if session.status == InterviewStatus.SCHEDULED:
        session.status = InterviewStatus.IN_PROGRESS
        from datetime import datetime, timezone
        session.started_at = datetime.now(timezone.utc)
        await db.commit()

    await websocket.send_json({"type": "state", "state": "listening"})

    try:
        while True:
            data = await websocket.receive_text()
            import json
            message = json.loads(data)

            if message["type"] == "text_message":
                user_msg = InterviewMessage(
                    session_id=session.id,
                    role=MessageRole.USER,
                    content=message["text"],
                    timestamp=datetime.now(timezone.utc),
                )
                db.add(user_msg)
                await db.flush()

                await websocket.send_json({
                    "type": "transcript",
                    "id": str(user_msg.id),
                    "text": message["text"],
                })

                await websocket.send_json({"type": "state", "state": "thinking"})

                import asyncio
                await asyncio.sleep(1)

                ai_response = f"I understand you said: '{message['text']}'. Let me ask a follow-up question. Can you elaborate on that?"

                interviewer_msg = InterviewMessage(
                    session_id=session.id,
                    role=MessageRole.INTERVIEWER,
                    content=ai_response,
                    timestamp=datetime.now(timezone.utc),
                )
                db.add(interviewer_msg)
                await db.flush()

                await websocket.send_json({
                    "type": "message",
                    "message": {
                        "id": str(interviewer_msg.id),
                        "role": "interviewer",
                        "content": ai_response,
                        "timestamp": interviewer_msg.timestamp.isoformat(),
                    },
                    "audio_url": None,
                })

                await websocket.send_json({"type": "state", "state": "listening"})

            elif message["type"] == "end_interview":
                session.status = InterviewStatus.COMPLETED
                session.ended_at = datetime.now(timezone.utc)
                if session.started_at:
                    session.duration_seconds = int((session.ended_at - session.started_at).total_seconds())
                await db.commit()
                await websocket.send_json({"type": "ended", "session": {"status": "completed"}})
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        await websocket.close()


@router.post("/{interview_id}/audio")
async def upload_interview_audio(
    interview_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {"message": "Audio upload endpoint - implement with file upload"}