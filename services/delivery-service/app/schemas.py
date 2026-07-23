from decimal import Decimal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "delivery-service"


class CalculateRequest(BaseModel):
    address: str | None = None


class CalculateResponse(BaseModel):
    fee: Decimal
    eta_minutes: int


class SuggestRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=256)


class SuggestResponse(BaseModel):
    suggestions: list[str]
