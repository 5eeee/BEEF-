"""Payment service tests."""

import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from app.models import Payment, PaymentMethod, PaymentStatus
from app.schemas import PaymentInitRequest, RefundRequest, YooKassaWebhookPayload
from app.services import PaymentService


class FakePublisher:
    def __init__(self):
        self.events: list[tuple[str, dict]] = []

    async def publish(self, routing_key: str, payload: dict) -> None:
        self.events.append((routing_key, payload))


@pytest.fixture
def publisher():
    return FakePublisher()


@pytest.fixture
def db_session():
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.execute = AsyncMock()
    return session


def make_payment(**overrides) -> Payment:
    payment = Payment(
        id=uuid4(),
        order_id=uuid4(),
        amount=Decimal("1500.00"),
        currency="RUB",
        method=PaymentMethod.CARD.value,
        status=PaymentStatus.PROCESSING.value,
        gateway_payment_id="mock_yk_abc123",
        payment_url="http://localhost:8000/api/v1/payments/mock-checkout/test",
    )
    for key, value in overrides.items():
        setattr(payment, key, value)
    return payment


@pytest.mark.asyncio
async def test_init_payment_creates_record(db_session, publisher, monkeypatch):
    monkeypatch.setattr("app.services.settings.auto_complete_payments", False)

    service = PaymentService(db_session, publisher)
    order_id = uuid4()
    payload = PaymentInitRequest(
        order_id=order_id,
        amount=Decimal("999.00"),
        method=PaymentMethod.CARD,
    )

    async def fake_refresh(obj):
        if isinstance(obj, Payment) and not getattr(obj, "id", None):
            obj.id = uuid4()

    db_session.refresh.side_effect = fake_refresh

    result = await service.init_payment(payload)

    assert result.status == PaymentStatus.PROCESSING
    assert result.payment_url is not None
    assert result.gateway_payment_id.startswith("mock_yk_")
    db_session.add.assert_called()
    db_session.commit.assert_awaited()


@pytest.mark.asyncio
async def test_auto_complete_publishes_event(db_session, publisher, monkeypatch):
    monkeypatch.setattr("app.services.settings.auto_complete_payments", True)

    payment = make_payment()
    payment.status = PaymentStatus.PROCESSING.value

    async def fake_flush():
        payment.id = payment.id or uuid4()

    db_session.flush.side_effect = fake_flush

    async def fake_refresh(obj):
        pass

    db_session.refresh.side_effect = fake_refresh

    service = PaymentService(db_session, publisher)
    payload = PaymentInitRequest(
        order_id=payment.order_id,
        amount=payment.amount,
        method=PaymentMethod.APPLE_PAY,
    )

    result = await service.init_payment(payload)

    assert result.status == PaymentStatus.SUCCEEDED
    assert any(e[0] == "payment.completed" for e in publisher.events)


@pytest.mark.asyncio
async def test_webhook_succeeds_payment(db_session, publisher):
    payment = make_payment(status=PaymentStatus.PROCESSING.value)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = payment
    db_session.execute.return_value = result_mock

    service = PaymentService(db_session, publisher)
    webhook = YooKassaWebhookPayload(
        event="payment.succeeded",
        object={
            "id": payment.gateway_payment_id,
            "status": "succeeded",
            "amount": {"value": "1500.00", "currency": "RUB"},
        },
    )

    result = await service.handle_webhook(webhook)

    assert result.status == PaymentStatus.SUCCEEDED
    assert payment.status == PaymentStatus.SUCCEEDED.value
    assert publisher.events[-1][0] == "payment.completed"


@pytest.mark.asyncio
async def test_webhook_fails_payment(db_session, publisher):
    payment = make_payment(status=PaymentStatus.PROCESSING.value)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = payment
    db_session.execute.return_value = result_mock

    service = PaymentService(db_session, publisher)
    webhook = YooKassaWebhookPayload(
        event="payment.failed",
        object={
            "id": payment.gateway_payment_id,
            "status": "failed",
            "amount": {"value": "1500.00", "currency": "RUB"},
        },
    )

    result = await service.handle_webhook(webhook)

    assert result.status == PaymentStatus.FAILED
    assert publisher.events[-1][0] == "payment.failed"


@pytest.mark.asyncio
async def test_refund_stub(db_session, publisher):
    payment = make_payment(status=PaymentStatus.SUCCEEDED.value)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = payment
    db_session.execute.return_value = result_mock

    service = PaymentService(db_session, publisher)
    result = await service.refund(payment.id, RefundRequest(reason="Customer request"))

    assert result.status == PaymentStatus.REFUNDED
    assert payment.status == PaymentStatus.REFUNDED.value


@pytest.mark.asyncio
async def test_refund_rejects_non_succeeded(db_session, publisher):
    payment = make_payment(status=PaymentStatus.PROCESSING.value)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = payment
    db_session.execute.return_value = result_mock

    service = PaymentService(db_session, publisher)
    with pytest.raises(ValueError, match="Only succeeded"):
        await service.refund(payment.id, RefundRequest())
