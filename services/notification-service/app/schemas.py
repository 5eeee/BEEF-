from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "notification-service"
    version: str = "0.1.0"


class PushSubscribeRequest(BaseModel):
    endpoint: str = Field(..., min_length=10, max_length=1024)
    p256dh_key: str = Field(..., min_length=10, max_length=256)
    auth_key: str = Field(..., min_length=10, max_length=256)
    user_id: UUID | None = None


class PushSubscribeResponse(BaseModel):
    id: UUID
    endpoint: str
    created_at: datetime


class NotificationLogResponse(BaseModel):
    id: UUID
    event_type: str
    channel: str
    recipient: str
    body: str
    status: str
    reference_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
