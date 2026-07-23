import json
import logging
from collections.abc import Awaitable, Callable

import aio_pika

from app.config import settings
from app.database import SessionLocal
from app.services import NotificationService

logger = logging.getLogger(__name__)

EVENTS_EXCHANGE = "beefshteks.events"

EventHandler = Callable[[NotificationService, dict], Awaitable[None]]

HANDLERS: dict[str, EventHandler] = {
    "order.created": lambda svc, payload: svc.handle_order_created(payload),
    "order.status_changed": lambda svc, payload: svc.handle_order_status_changed(payload),
    "payment.completed": lambda svc, payload: svc.handle_payment_completed(payload),
}


class EventConsumer:
    def __init__(self, connection: aio_pika.RobustConnection):
        self._connection = connection

    async def start(self) -> None:
        channel = await self._connection.channel()
        await channel.set_qos(prefetch_count=10)
        exchange = await channel.declare_exchange(EVENTS_EXCHANGE, aio_pika.ExchangeType.DIRECT, durable=True)
        queue = await channel.declare_queue("notification-service", durable=True)
        for routing_key in HANDLERS:
            await queue.bind(exchange, routing_key=routing_key)

        async def on_message(message: aio_pika.IncomingMessage) -> None:
            async with message.process():
                routing_key = message.routing_key or ""
                handler = HANDLERS.get(routing_key)
                if not handler:
                    logger.warning("No handler for routing key: %s", routing_key)
                    return
                try:
                    payload = json.loads(message.body.decode())
                except json.JSONDecodeError:
                    logger.exception("Invalid JSON in message")
                    return
                async with SessionLocal() as session:
                    service = NotificationService(session)
                    await handler(service, payload)

        await queue.consume(on_message)
        logger.info("Notification consumer started for: %s", ", ".join(HANDLERS))


async def connect_rabbitmq() -> aio_pika.RobustConnection | None:
    try:
        return await aio_pika.connect_robust(settings.rabbitmq_url)
    except Exception:
        logger.warning("RabbitMQ unavailable — notification consumer disabled")
        return None
