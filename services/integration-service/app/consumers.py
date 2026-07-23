import json
import logging

import aio_pika

from app.config import settings
from app.database import SessionLocal
from app.services import IntegrationService

logger = logging.getLogger(__name__)

EVENTS_EXCHANGE = "beefshteks.events"
CRM_EVENT_TYPES = ("order.confirmed", "order.created")


class EventConsumer:
    def __init__(self, connection: aio_pika.RobustConnection):
        self._connection = connection

    async def start(self) -> None:
        channel = await self._connection.channel()
        await channel.set_qos(prefetch_count=5)
        exchange = await channel.declare_exchange(EVENTS_EXCHANGE, aio_pika.ExchangeType.DIRECT, durable=True)
        queue = await channel.declare_queue("integration-service", durable=True)
        for routing_key in CRM_EVENT_TYPES:
            await queue.bind(exchange, routing_key=routing_key)

        async def on_message(message: aio_pika.IncomingMessage) -> None:
            async with message.process():
                routing_key = message.routing_key or ""
                if routing_key not in CRM_EVENT_TYPES:
                    return
                try:
                    payload = json.loads(message.body.decode())
                except json.JSONDecodeError:
                    logger.exception("Invalid JSON in CRM event")
                    return
                async with SessionLocal() as session:
                    service = IntegrationService(session)
                    await service.sync_order_to_crm(routing_key, payload)

        await queue.consume(on_message)
        logger.info("Integration consumer started for: %s", ", ".join(CRM_EVENT_TYPES))


async def connect_rabbitmq() -> aio_pika.RobustConnection | None:
    try:
        return await aio_pika.connect_robust(settings.rabbitmq_url)
    except Exception:
        logger.warning("RabbitMQ unavailable — integration consumer disabled")
        return None
