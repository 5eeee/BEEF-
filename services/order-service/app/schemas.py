from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models import DeliveryType, OrderStatus, PaymentMethod


class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., ge=1, le=99)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=99)


class CartItemResponse(BaseModel):
    product_id: UUID
    product_slug: str
    name: str
    unit_price: Decimal
    quantity: int
    image_url: str | None = None
    line_total: Decimal


class CartResponse(BaseModel):
    session_id: str
    items: list[CartItemResponse]
    subtotal: Decimal
    item_count: int


class CheckoutRequest(BaseModel):
    delivery_type: DeliveryType
    customer_name: str = Field(..., min_length=2, max_length=128)
    customer_phone: str = Field(..., pattern=r"^\+7\d{10}$")
    delivery_address: str | None = Field(None, max_length=512)
    comment: str | None = Field(None, max_length=1000)
    payment_method: PaymentMethod
    promo_code: str | None = Field(None, max_length=32)

    @field_validator("delivery_address")
    @classmethod
    def address_required_for_delivery(cls, v: str | None, info) -> str | None:
        if info.data.get("delivery_type") == DeliveryType.DELIVERY and not v:
            raise ValueError("delivery_address is required for delivery orders")
        return v


class OrderItemResponse(BaseModel):
    product_id: UUID
    product_slug: str
    name: str
    unit_price: Decimal
    quantity: int
    image_url: str | None
    line_total: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    status: OrderStatus
    delivery_type: DeliveryType
    payment_method: PaymentMethod | None
    customer_name: str
    customer_phone: str
    delivery_address: str | None
    comment: str | None
    subtotal: Decimal
    delivery_fee: Decimal
    discount: Decimal
    total: Decimal
    promo_code: str | None
    estimated_ready_at: datetime | None
    items: list[OrderItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplyPromoRequest(BaseModel):
    promo_code: str = Field(..., min_length=3, max_length=32)


class PromoApplyResponse(BaseModel):
    promo_code: str
    discount: Decimal
    subtotal: Decimal
    total: Decimal


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class PaymentCallbackRequest(BaseModel):
    payment_id: UUID
    status: str = Field(..., pattern=r"^(succeeded|failed|cancelled)$")
    amount: Decimal | None = None


class PaymentCallbackResponse(BaseModel):
    order_id: UUID
    status: OrderStatus
    message: str


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "order-service"
    version: str = "0.1.0"
