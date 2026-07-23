"""Shared Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from beefshteks_common.events import DeliveryType, OrderStatus, PaymentMethod


class Money(BaseModel):
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    currency: str = "RUB"


class OrderItemSnapshot(BaseModel):
    product_id: UUID
    product_slug: str
    name: str
    unit_price: Decimal
    quantity: int = Field(..., ge=1)
    image_url: str | None = None

    @property
    def line_total(self) -> Decimal:
        return self.unit_price * self.quantity


class OrderCreatedEvent(BaseModel):
    order_id: UUID
    user_id: UUID | None
    items: list[OrderItemSnapshot]
    subtotal: Decimal
    delivery_fee: Decimal
    discount: Decimal
    total: Decimal
    delivery_type: DeliveryType
    customer_phone: str
    customer_name: str
    delivery_address: str | None
    created_at: datetime


class OrderStatusChangedEvent(BaseModel):
    order_id: UUID
    old_status: OrderStatus
    new_status: OrderStatus
    changed_at: datetime


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str
    version: str = "0.1.0"
