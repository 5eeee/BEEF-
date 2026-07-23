from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas import (
    PaymentInitRequest,
    PaymentInitResponse,
    PaymentSimulateRequest,
    PaymentStatusResponse,
    RefundRequest,
    RefundResponse,
    YooKassaWebhookPayload,
)
from app.services import EventPublisher, PaymentService

router = APIRouter(prefix="/api/v1")


async def get_publisher() -> EventPublisher:
    from app.main import rabbitmq_connection

    return EventPublisher(rabbitmq_connection)


async def get_payment_service(
    db: AsyncSession = Depends(get_db),
    publisher: EventPublisher = Depends(get_publisher),
) -> PaymentService:
    return PaymentService(db, publisher)


def verify_webhook_secret(x_webhook_secret: str | None = Header(None, alias="X-Webhook-Secret")):
    if x_webhook_secret != settings.payment_gateway_secret:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")


@router.post("/payments/init", response_model=PaymentInitResponse, status_code=status.HTTP_201_CREATED)
async def init_payment(
    payload: PaymentInitRequest,
    service: PaymentService = Depends(get_payment_service),
):
    return await service.init_payment(payload)


@router.get("/payments/{payment_id}/status", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: UUID,
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.get_status(payment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Payment not found")
    return result


@router.post("/payments/webhook", response_model=PaymentStatusResponse)
async def payment_webhook(
    payload: YooKassaWebhookPayload,
    _: None = Depends(verify_webhook_secret),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.handle_webhook(payload)
    if not result:
        raise HTTPException(status_code=404, detail="Payment not found")
    return result


@router.post("/payments/{payment_id}/refund", response_model=RefundResponse)
async def refund_payment(
    payment_id: UUID,
    payload: RefundRequest,
    service: PaymentService = Depends(get_payment_service),
):
    try:
        result = await service.refund(payment_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=404, detail="Payment not found")
    return result


@router.post("/payments/{payment_id}/simulate", response_model=PaymentStatusResponse)
async def simulate_payment(
    payment_id: UUID,
    payload: PaymentSimulateRequest,
    service: PaymentService = Depends(get_payment_service),
):
    if not settings.debug and not settings.auto_complete_payments:
        raise HTTPException(status_code=403, detail="Simulation disabled in production")
    result = await service.simulate_payment(payment_id, payload.outcome)
    if not result:
        raise HTTPException(status_code=404, detail="Payment not found")
    return result


@router.get("/payments/mock-checkout/{payment_id}")
async def mock_checkout_page(payment_id: UUID):
    """Dev mock checkout page — user would be redirected here from payment_url."""
    return {
        "message": "Mock payment gateway checkout",
        "payment_id": str(payment_id),
        "hint": "POST /api/v1/payments/{id}/simulate to complete payment in dev",
    }
