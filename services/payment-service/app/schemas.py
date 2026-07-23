from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models import PaymentMethod, PaymentStatus


class PaymentInitRequest(BaseModel):
    order_id: UUID
    amount: Decimal = Field(..., gt=0)
    method: PaymentMethod
    currency: str = Field(default="RUB", min_length=3, max_length=3)


class PaymentInitResponse(BaseModel):
    payment_id: UUID
    payment_url: str | None = None
    status: PaymentStatus
    gateway_payment_id: str | None = None


class PaymentStatusResponse(BaseModel):
    payment_id: UUID
    order_id: UUID
    amount: Decimal
    currency: str
    method: PaymentMethod
    status: PaymentStatus
    gateway_payment_id: str | None
    created_at: datetime
    updated_at: datetime


class YooKassaAmount(BaseModel):
    value: str
    currency: str = "RUB"


class YooKassaObject(BaseModel):
    id: str
    status: str
    amount: YooKassaAmount
    metadata: dict | None = None


class YooKassaWebhookPayload(BaseModel):
    """Mock ЮKassa notification format."""

    type: str = "notification"
    event: str
    object: YooKassaObject


class RefundRequest(BaseModel):
    amount: Decimal | None = Field(None, gt=0)
    reason: str | None = Field(None, max_length=256)


class RefundResponse(BaseModel):
    payment_id: UUID
    status: PaymentStatus
    message: str


class PaymentSimulateRequest(BaseModel):
    outcome: str = Field(default="succeeded", pattern=r"^(succeeded|failed|cancelled)$")


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "payment-service"
    version: str = "0.1.0"
