from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MediaAssetResponse(BaseModel):
    id: UUID
    filename: str
    url: str
    mime: str
    size: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "media-service"
    version: str = "0.1.0"
