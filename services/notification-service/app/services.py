import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import NotificationChannel, NotificationLog, NotificationStatus, NotificationTemplate, PushSubscription

logger = logging.getLogger(__name__)

DEFAULT_TEMPLATES = [
    {
        "event_type": "order.created",
        "channel": NotificationChannel.SMS,
        "subject": None,
        "body_template": "Заказ #{order_number} принят. Сумма: {total} ₽. Beefshteks",
    },
    {
        "event_type": "order.status_changed",
        "channel": NotificationChannel.SMS,
        "subject": None,
        "body_template": "Заказ #{order_number}: статус «{new_status}». Beefshteks",
    },
    {
        "event_type": "order.status_changed",
        "channel": NotificationChannel.PUSH,
        "subject": "Статус заказа",
        "body_template": "Заказ #{order_number}: {new_status}",
    },
    {
        "event_type": "payment.completed",
        "channel": NotificationChannel.SMS,
        "subject": None,
        "body_template": "Оплата заказа #{order_number} прошла успешно. Beefshteks",
    },
]


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ensure_default_templates(self) -> None:
        for tpl in DEFAULT_TEMPLATES:
            result = await self.db.execute(
                select(NotificationTemplate).where(
                    NotificationTemplate.event_type == tpl["event_type"],
                    NotificationTemplate.channel == tpl["channel"],
                )
            )
            if result.scalar_one_or_none():
                continue
            self.db.add(NotificationTemplate(**tpl))
        await self.db.commit()

    async def subscribe_push(self, payload: dict) -> PushSubscription:
        result = await self.db.execute(
            select(PushSubscription).where(PushSubscription.endpoint == payload["endpoint"])
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.p256dh_key = payload["p256dh_key"]
            existing.auth_key = payload["auth_key"]
            existing.user_id = payload.get("user_id")
            await self.db.commit()
            await self.db.refresh(existing)
            return existing

        sub = PushSubscription(
            endpoint=payload["endpoint"],
            p256dh_key=payload["p256dh_key"],
            auth_key=payload["auth_key"],
            user_id=payload.get("user_id"),
        )
        self.db.add(sub)
        await self.db.commit()
        await self.db.refresh(sub)
        return sub

    async def handle_order_created(self, payload: dict) -> None:
        await self._send_sms("order.created", payload, payload.get("customer_phone", ""))

    async def handle_order_status_changed(self, payload: dict) -> None:
        phone = payload.get("customer_phone", "")
        await self._send_sms("order.status_changed", payload, phone)
        await self._send_push("order.status_changed", payload, payload.get("user_id"))

    async def handle_payment_completed(self, payload: dict) -> None:
        await self._send_sms("payment.completed", payload, payload.get("customer_phone", ""))

    async def _send_sms(self, event_type: str, context: dict, recipient: str) -> None:
        if not recipient:
            logger.warning("SMS skipped for %s: no recipient", event_type)
            return
        template = await self._get_template(event_type, NotificationChannel.SMS)
        body = self._render_template(template.body_template if template else self._fallback_body(event_type), context)
        logger.info("[SMS MOCK] to=%s body=%s", recipient, body)
        await self._log_notification(event_type, NotificationChannel.SMS, recipient, body, context)

    async def _send_push(self, event_type: str, context: dict, user_id: UUID | str | None) -> None:
        if not user_id:
            return
        uid = UUID(str(user_id))
        result = await self.db.execute(select(PushSubscription).where(PushSubscription.user_id == uid))
        subscriptions = result.scalars().all()
        if not subscriptions:
            logger.info("No push subscriptions for user %s", uid)
            return

        template = await self._get_template(event_type, NotificationChannel.PUSH)
        body = self._render_template(template.body_template if template else self._fallback_body(event_type), context)
        for sub in subscriptions:
            logger.info("[WEB PUSH STUB] endpoint=%s body=%s", sub.endpoint[:48], body)
            await self._log_notification(
                event_type, NotificationChannel.PUSH, sub.endpoint, body, context, NotificationStatus.SENT
            )

    async def _get_template(self, event_type: str, channel: NotificationChannel) -> NotificationTemplate | None:
        result = await self.db.execute(
            select(NotificationTemplate).where(
                NotificationTemplate.event_type == event_type,
                NotificationTemplate.channel == channel,
                NotificationTemplate.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def _log_notification(
        self,
        event_type: str,
        channel: NotificationChannel,
        recipient: str,
        body: str,
        context: dict,
        status: NotificationStatus = NotificationStatus.SENT,
    ) -> None:
        template = await self._get_template(event_type, channel)
        log = NotificationLog(
            template_id=template.id if template else None,
            event_type=event_type,
            channel=channel,
            recipient=recipient,
            body=body,
            status=status,
            reference_id=str(context.get("order_id") or context.get("order_number") or ""),
        )
        self.db.add(log)
        await self.db.commit()

    @staticmethod
    def _render_template(template: str, context: dict) -> str:
        safe = {k: str(v) for k, v in context.items()}
        try:
            return template.format(**safe)
        except KeyError:
            return template

    @staticmethod
    def _fallback_body(event_type: str) -> str:
        return {
            "order.created": "Ваш заказ принят",
            "order.status_changed": "Статус заказа обновлён",
            "payment.completed": "Оплата прошла успешно",
        }.get(event_type, "Уведомление от Beefshteks")
