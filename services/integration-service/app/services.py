import asyncio
import logging
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import CrmOrderMapping, SyncLog, SyncStatus

logger = logging.getLogger(__name__)


class CrmSyncError(Exception):
    pass


class IntegrationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def sync_order_to_crm(self, event_type: str, payload: dict) -> SyncLog:
        order_id = UUID(str(payload["order_id"]))
        result = await self.db.execute(select(SyncLog).where(SyncLog.order_id == order_id, SyncLog.event_type == event_type))
        sync_log = result.scalar_one_or_none()
        if not sync_log:
            sync_log = SyncLog(order_id=order_id, event_type=event_type, status=SyncStatus.PENDING)
            self.db.add(sync_log)
            await self.db.commit()
            await self.db.refresh(sync_log)

        if sync_log.status == SyncStatus.SUCCESS:
            logger.info("Order %s already synced for %s", order_id, event_type)
            return sync_log

        last_error: str | None = None
        for attempt in range(1, settings.crm_max_retries + 1):
            sync_log.attempt_count = attempt
            sync_log.status = SyncStatus.PENDING
            await self.db.commit()
            try:
                crm_response = await self._mock_crm_push(payload, attempt)
                mapping = await self._upsert_mapping(order_id, crm_response["crm_order_id"])
                sync_log.status = SyncStatus.SUCCESS
                sync_log.crm_response = crm_response
                sync_log.error_message = None
                await self.db.commit()
                logger.info(
                    "CRM sync success order=%s crm_id=%s attempts=%s",
                    order_id,
                    mapping.crm_order_id,
                    attempt,
                )
                return sync_log
            except CrmSyncError as exc:
                last_error = str(exc)
                sync_log.error_message = last_error
                if attempt < settings.crm_max_retries:
                    delay = settings.crm_base_backoff_seconds * (2 ** (attempt - 1))
                    logger.warning(
                        "CRM sync attempt %s failed for order %s, retry in %.1fs: %s",
                        attempt,
                        order_id,
                        delay,
                        last_error,
                    )
                    await self.db.commit()
                    await asyncio.sleep(delay)
                else:
                    sync_log.status = SyncStatus.FAILED
                    await self.db.commit()
                    logger.error("CRM sync failed for order %s after %s attempts", order_id, attempt)

        return sync_log

    async def list_sync_logs(self, limit: int = 50) -> list[SyncLog]:
        result = await self.db.execute(select(SyncLog).order_by(SyncLog.created_at.desc()).limit(limit))
        return list(result.scalars().all())

    async def _upsert_mapping(self, order_id: UUID, crm_order_id: str) -> CrmOrderMapping:
        result = await self.db.execute(select(CrmOrderMapping).where(CrmOrderMapping.order_id == order_id))
        mapping = result.scalar_one_or_none()
        if mapping:
            mapping.crm_order_id = crm_order_id
        else:
            mapping = CrmOrderMapping(order_id=order_id, crm_order_id=crm_order_id)
            self.db.add(mapping)
        await self.db.commit()
        await self.db.refresh(mapping)
        return mapping

    async def _mock_crm_push(self, payload: dict, attempt: int) -> dict:
        order_number = payload.get("order_number", payload.get("order_id"))
        logger.info("[CRM MOCK] pushing order %s (attempt %s)", order_number, attempt)
        if payload.get("force_crm_failure") and attempt < settings.crm_max_retries:
            raise CrmSyncError("Simulated CRM unavailable")
        crm_order_id = f"CRM-{str(payload.get('order_id', uuid4()))[:8].upper()}"
        return {
            "crm_order_id": crm_order_id,
            "order_number": order_number,
            "status": "accepted",
        }
