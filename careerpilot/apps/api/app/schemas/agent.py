from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Any


class AgentActivityRead(BaseModel):
    id: UUID
    user_id: UUID
    agent_name: str
    action: str
    input_ref: str | None = None
    output_ref: str | None = None
    status: str
    error_message: str | None = None
    metadata: dict[str, Any]
    created_at: datetime
    completed_at: datetime | None = None

    class Config:
        from_attributes = True