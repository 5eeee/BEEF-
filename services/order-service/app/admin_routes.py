from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin_auth import verify_admin
from app.database import get_db
from app.models import Order, OrderStatus
from app.routes import get_order_service
from app.schemas import OrderResponse, OrderStatusUpdate
from app.services import OrderService

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/orders", response_model=list[OrderResponse])
async def list_admin_orders(
    _: None = Depends(verify_admin),
    status: OrderStatus | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    service: OrderService = Depends(get_order_service),
):
    query = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
    if status:
        query = query.where(Order.status == status.value)
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().unique().all()
    return [service._to_order_response(o) for o in orders]


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def admin_update_order_status(
    order_id: UUID,
    body: OrderStatusUpdate,
    _: None = Depends(verify_admin),
    service: OrderService = Depends(get_order_service),
):
    try:
        return await service.update_order_status(order_id, body)
    except ValueError as exc:
        detail = str(exc)
        status_code = 404 if detail == "Order not found" else 400
        raise HTTPException(status_code=status_code, detail=detail) from exc


@router.get("/stats")
async def admin_stats(
    _: None = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
):
    today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    excluded = [OrderStatus.CANCELLED.value, OrderStatus.DRAFT.value]

    count_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.created_at >= today_start,
            Order.status.not_in(excluded),
        )
    )
    orders_today = count_result.scalar_one()

    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total), 0)).where(
            Order.created_at >= today_start,
            Order.status.not_in(excluded),
        )
    )
    revenue_today = revenue_result.scalar_one()

    pending_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.status.in_(
                [
                    OrderStatus.PAID.value,
                    OrderStatus.CONFIRMED.value,
                    OrderStatus.PREPARING.value,
                    OrderStatus.READY.value,
                    OrderStatus.DELIVERING.value,
                ]
            )
        )
    )
    active_orders = pending_result.scalar_one()

    return {
        "orders_today": orders_today,
        "revenue_today": str(revenue_today),
        "active_orders": active_orders,
        "date": today_start.date().isoformat(),
    }
