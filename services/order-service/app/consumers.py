import json
import logging
from uuid import UUID

import aio_pika
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import OrderStatus
from app.services import OrderService

logger = logging.getLogger(__name__)

QUEUE_NAME = "order-service.payments"
ROUTING_KEYS = ("payment.completed", "payment.failed")
EVENTS_EXCHANGE = "beefshteks.events"


async def handle_payment_message(
    message: aio_pika.IncomingMessage,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with message.process():
        try:
            payload = json.loads(message.body.decode())
            order_id = UUID(payload["order_id"])
            routing_key = message.routing_key or ""

            async with session_factory() as db:
                service = OrderService(db)
                if routing_key == "payment.completed":
                    updated = await service.update_payment_status(order_id, OrderStatus.PAID)
                elif routing_key == "payment.failed":
                    updated = await service.update_payment_status(order_id, OrderStatus.CANCELLED)
                else:
                    logger.warning("Unknown routing key: %s", routing_key)
                    return

                if updated:
                    logger.info("Order %s updated to %s via %s", order_id, updated.status, routing_key)
                else:
                    logger.warning("Order %s not found for event %s", order_id, routing_key)
        except Exception:
            logger.exception("Failed to process payment event")
            raise


async def start_payment_consumer(
    connection: aio_pika.RobustConnection,
    session_factory: async_sessionmaker[AsyncSession],
) -> aio_pika.RobustChannel:
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)

    queue = await channel.declare_queue(QUEUE_NAME, durable=True)
    exchange = await channel.declare_exchange(EVENTS_EXCHANGE, aio_pika.ExchangeType.DIRECT, durable=True)
    for key in ROUTING_KEYS:
        await queue.bind(exchange, routing_key=key)

    async def on_message(message: aio_pika.IncomingMessage) -> None:
        await handle_payment_message(message, session_factory)

    await queue.consume(on_message)
    logger.info("Payment event consumer started on queue %s", QUEUE_NAME)
    return channel
