from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "integration-service"
    version: str = "0.1.0"


class SyncLogResponse(BaseModel):
    id: UUID
    order_id: UUID
    event_type: str
    status: str
    attempt_count: int
    crm_response: dict | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
