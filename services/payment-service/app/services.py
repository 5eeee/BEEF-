import json
import logging
from uuid import UUID, uuid4

import aio_pika
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Payment, PaymentAttempt, PaymentMethod, PaymentStatus
from app.schemas import (
    PaymentInitRequest,
    PaymentInitResponse,
    PaymentStatusResponse,
    RefundRequest,
    RefundResponse,
    YooKassaWebhookPayload,
)

logger = logging.getLogger(__name__)

EVENT_PAYMENT_COMPLETED = "payment.completed"
EVENT_PAYMENT_FAILED = "payment.failed"
EVENTS_EXCHANGE = "beefshteks.events"


def generate_gateway_payment_id() -> str:
    return f"mock_yk_{uuid4().hex[:16]}"


def build_payment_url(payment_id: UUID, gateway_payment_id: str) -> str:
    return f"{settings.base_url}/api/v1/payments/mock-checkout/{payment_id}?gateway_id={gateway_payment_id}"


class EventPublisher:
    """Публикация доменных событий в RabbitMQ."""

    def __init__(self, connection: aio_pika.RobustConnection | None = None):
        self._connection = connection

    async def publish(self, routing_key: str, payload: dict) -> None:
        if not self._connection:
            logger.warning("RabbitMQ not connected, skipping event: %s", routing_key)
            return
        channel = await self._connection.channel()
        exchange = await channel.declare_exchange(
            EVENTS_EXCHANGE, aio_pika.ExchangeType.DIRECT, durable=True
        )
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps(payload, default=str).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key=routing_key,
        )
        await channel.close()


class PaymentService:
    def __init__(
        self,
        db: AsyncSession,
        publisher: EventPublisher | None = None,
    ):
        self.db = db
        self.publisher = publisher or EventPublisher()

    async def init_payment(self, payload: PaymentInitRequest) -> PaymentInitResponse:
        gateway_payment_id = generate_gateway_payment_id()
        payment = Payment(
            order_id=payload.order_id,
            amount=payload.amount,
            currency=payload.currency.upper(),
            method=payload.method.value,
            status=PaymentStatus.PROCESSING,
            gateway_payment_id=gateway_payment_id,
        )
        self.db.add(payment)
        await self.db.flush()

        payment.payment_url = build_payment_url(payment.id, gateway_payment_id)

        attempt = PaymentAttempt(
            payment_id=payment.id,
            status=PaymentStatus.PROCESSING,
            gateway_response={"action": "init", "gateway_payment_id": gateway_payment_id},
        )
        self.db.add(attempt)
        await self.db.commit()
        await self.db.refresh(payment)

        if settings.auto_complete_payments:
            completed = await self._complete_payment(payment, gateway_payment_id, auto=True)
            return PaymentInitResponse(
                payment_id=completed.payment_id,
                payment_url=payment.payment_url,
                status=completed.status,
                gateway_payment_id=gateway_payment_id,
            )

        return PaymentInitResponse(
            payment_id=payment.id,
            payment_url=payment.payment_url,
            status=PaymentStatus(payment.status),
            gateway_payment_id=gateway_payment_id,
        )

    async def get_status(self, payment_id: UUID) -> PaymentStatusResponse | None:
        payment = await self._get_payment(payment_id)
        if not payment:
            return None
        return self._to_status_response(payment)

    async def handle_webhook(self, payload: YooKassaWebhookPayload) -> PaymentStatusResponse | None:
        gateway_payment_id = payload.object.id
        payment = await self._get_payment_by_gateway_id(gateway_payment_id)
        if not payment:
            logger.warning("Payment not found for gateway id: %s", gateway_payment_id)
            return None

        event = payload.event
        if event == "payment.succeeded":
            return await self._complete_payment(payment, gateway_payment_id, payload.model_dump())
        if event in ("payment.canceled", "payment.cancelled"):
            return await self._fail_payment(
                payment, gateway_payment_id, payload.model_dump(), cancelled=True
            )
        if event == "payment.failed":
            return await self._fail_payment(payment, gateway_payment_id, payload.model_dump())

        logger.info("Ignoring webhook event: %s", event)
        return self._to_status_response(payment)

    async def simulate_payment(
        self, payment_id: UUID, outcome: str = "succeeded"
    ) -> PaymentStatusResponse | None:
        payment = await self._get_payment(payment_id)
        if not payment:
            return None
        if not payment.gateway_payment_id:
            return None

        event_map = {
            "succeeded": "payment.succeeded",
            "failed": "payment.failed",
            "cancelled": "payment.canceled",
        }
        webhook = YooKassaWebhookPayload(
            event=event_map[outcome],
            object={
                "id": payment.gateway_payment_id,
                "status": outcome,
                "amount": {"value": str(payment.amount), "currency": payment.currency},
                "metadata": {"payment_id": str(payment.id), "order_id": str(payment.order_id)},
            },
        )
        return await self.handle_webhook(webhook)

    async def refund(self, payment_id: UUID, payload: RefundRequest) -> RefundResponse | None:
        payment = await self._get_payment(payment_id)
        if not payment:
            return None
        if payment.status != PaymentStatus.SUCCEEDED:
            raise ValueError("Only succeeded payments can be refunded")

        payment.status = PaymentStatus.REFUNDED
        attempt = PaymentAttempt(
            payment_id=payment.id,
            status=PaymentStatus.REFUNDED,
            gateway_response={
                "action": "refund_stub",
                "amount": str(payload.amount or payment.amount),
                "reason": payload.reason,
            },
        )
        self.db.add(attempt)
        await self.db.commit()
        await self.db.refresh(payment)

        return RefundResponse(
            payment_id=payment.id,
            status=PaymentStatus.REFUNDED,
            message="Refund stub recorded — gateway integration pending",
        )

    async def _complete_payment(
        self,
        payment: Payment,
        gateway_payment_id: str,
        gateway_response: dict | None = None,
        auto: bool = False,
    ) -> PaymentStatusResponse:
        if payment.status == PaymentStatus.SUCCEEDED:
            return self._to_status_response(payment)

        payment.status = PaymentStatus.SUCCEEDED
        attempt = PaymentAttempt(
            payment_id=payment.id,
            status=PaymentStatus.SUCCEEDED,
            gateway_response=gateway_response or {"action": "auto_complete" if auto else "webhook"},
        )
        self.db.add(attempt)
        await self.db.commit()
        await self.db.refresh(payment)

        await self.publisher.publish(
            EVENT_PAYMENT_COMPLETED,
            {
                "payment_id": str(payment.id),
                "order_id": str(payment.order_id),
                "amount": str(payment.amount),
                "currency": payment.currency,
                "method": payment.method,
                "gateway_payment_id": gateway_payment_id,
            },
        )
        return self._to_status_response(payment)

    async def _fail_payment(
        self,
        payment: Payment,
        gateway_payment_id: str,
        gateway_response: dict | None = None,
        cancelled: bool = False,
    ) -> PaymentStatusResponse:
        status = PaymentStatus.CANCELLED if cancelled else PaymentStatus.FAILED
        if payment.status in (PaymentStatus.SUCCEEDED, PaymentStatus.REFUNDED):
            return self._to_status_response(payment)

        payment.status = status
        attempt = PaymentAttempt(
            payment_id=payment.id,
            status=status,
            gateway_response=gateway_response,
            error_message="Payment cancelled by user" if cancelled else "Payment failed",
        )
        self.db.add(attempt)
        await self.db.commit()
        await self.db.refresh(payment)

        await self.publisher.publish(
            EVENT_PAYMENT_FAILED,
            {
                "payment_id": str(payment.id),
                "order_id": str(payment.order_id),
                "amount": str(payment.amount),
                "status": status,
                "gateway_payment_id": gateway_payment_id,
            },
        )
        return self._to_status_response(payment)

    async def _get_payment(self, payment_id: UUID) -> Payment | None:
        result = await self.db.execute(select(Payment).where(Payment.id == payment_id))
        return result.scalar_one_or_none()

    async def _get_payment_by_gateway_id(self, gateway_payment_id: str) -> Payment | None:
        result = await self.db.execute(
            select(Payment).where(Payment.gateway_payment_id == gateway_payment_id)
        )
        return result.scalar_one_or_none()

    def _to_status_response(self, payment: Payment) -> PaymentStatusResponse:
        return PaymentStatusResponse(
            payment_id=payment.id,
            order_id=payment.order_id,
            amount=payment.amount,
            currency=payment.currency,
            method=PaymentMethod(payment.method),
            status=PaymentStatus(payment.status),
            gateway_payment_id=payment.gateway_payment_id,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
        )
