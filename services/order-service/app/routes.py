from uuid import UUID

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories import CartRepository
from app.models import OrderStatus
from app.schemas import (
    ApplyPromoRequest,
    CartItemCreate,
    CartItemUpdate,
    CartResponse,
    CheckoutRequest,
    OrderResponse,
    OrderStatusUpdate,
    PaymentCallbackRequest,
    PaymentCallbackResponse,
    PromoApplyResponse,
)
from app.services import EventPublisher, OrderService

router = APIRouter(prefix="/api/v1")


def get_session_id(x_session_id: str = Header(..., alias="X-Session-Id")) -> str:
    if len(x_session_id) < 8:
        raise HTTPException(status_code=400, detail="Invalid session id")
    return x_session_id


async def get_redis() -> aioredis.Redis:
    from app.main import redis_client

    return redis_client


async def get_order_service(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> OrderService:
    from app.main import rabbitmq_connection

    publisher = EventPublisher(rabbitmq_connection)
    return OrderService(db, CartRepository(redis), event_publisher=publisher)


@router.get("/cart", response_model=CartResponse)
async def get_cart(
    session_id: str = Depends(get_session_id),
    service: OrderService = Depends(get_order_service),
):
    return await service.get_cart(session_id)


@router.post("/cart/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_cart_item(
    item: CartItemCreate,
    session_id: str = Depends(get_session_id),
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.add_to_cart(session_id, item)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/cart/items/{product_id}", response_model=CartResponse)
async def update_cart_item(
    product_id: UUID,
    body: CartItemUpdate,
    session_id: str = Depends(get_session_id),
    service: OrderService = Depends(get_order_service),
):
    return await service.update_cart_item(session_id, product_id, body.quantity)


@router.delete("/cart/items/{product_id}", response_model=CartResponse)
async def remove_cart_item(
    product_id: UUID,
    session_id: str = Depends(get_session_id),
    service: OrderService = Depends(get_order_service),
):
    return await service.remove_from_cart(session_id, product_id)


@router.post("/cart/promo", response_model=PromoApplyResponse)
async def apply_promo(
    body: ApplyPromoRequest,
    session_id: str = Depends(get_session_id),
    service: OrderService = Depends(get_order_service),
    x_user_id: str | None = Header(None, alias="X-User-Id"),
):
    user_id = UUID(x_user_id) if x_user_id else None
    try:
        result = await service.apply_promo(session_id, body.promo_code, user_id)
        return PromoApplyResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/orders/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    payload: CheckoutRequest,
    session_id: str = Depends(get_session_id),
    service: OrderService = Depends(get_order_service),
    x_user_id: str | None = Header(None, alias="X-User-Id"),
):
    user_id = UUID(x_user_id) if x_user_id else None
    try:
        return await service.checkout(session_id, payload, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    service: OrderService = Depends(get_order_service),
):
    order = await service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    body: OrderStatusUpdate,
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.update_order_status(order_id, body)
    except ValueError as exc:
        detail = str(exc)
        status_code = 404 if detail == "Order not found" else 400
        raise HTTPException(status_code=status_code, detail=detail) from exc


@router.get("/orders/user/{user_id}", response_model=list[OrderResponse])
async def list_user_orders(
    user_id: UUID,
    service: OrderService = Depends(get_order_service),
):
    return await service.get_user_orders(user_id)


@router.post("/orders/{order_id}/payment-callback", response_model=PaymentCallbackResponse)
async def payment_callback(
    order_id: UUID,
    payload: PaymentCallbackRequest,
    service: OrderService = Depends(get_order_service),
):
    status_map = {
        "succeeded": OrderStatus.PAID,
        "failed": OrderStatus.CANCELLED,
        "cancelled": OrderStatus.CANCELLED,
    }
    order = await service.update_payment_status(order_id, status_map[payload.status])
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return PaymentCallbackResponse(
        order_id=order.id,
        status=OrderStatus(order.status),
        message=f"Order updated from payment {payload.payment_id}",
    )
