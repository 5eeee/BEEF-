import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import redis.asyncio as aioredis
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token
from app.config import settings
from app.models import Address, OtpCode, RefreshToken, User
from app.schemas import (
    AddressCreate,
    AddressResponse,
    AddressUpdate,
    OtpSendRequest,
    OtpSendResponse,
    OtpVerifyRequest,
    RefreshRequest,
    RefreshResponse,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
)

logger = logging.getLogger(__name__)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _utcnow() -> datetime:
    return datetime.now(UTC)


class OtpService:
    OTP_KEY = "otp:{phone}"
    RATE_KEY = "otp_rate:{phone}"
    ATTEMPTS_KEY = "otp_attempts:{phone}"

    def __init__(self, redis: aioredis.Redis, db: AsyncSession):
        self.redis = redis
        self.db = db

    def _generate_code(self) -> str:
        if settings.debug:
            return settings.otp_mock_code
        return f"{secrets.randbelow(10000):04d}"

    async def send_otp(self, payload: OtpSendRequest) -> OtpSendResponse:
        phone = payload.phone

        if await self.redis.exists(self.RATE_KEY.format(phone=phone)):
            raise ValueError("Слишком частые запросы. Попробуйте через минуту.")

        code = self._generate_code()
        ttl = settings.otp_ttl_seconds

        await self.redis.setex(self.OTP_KEY.format(phone=phone), ttl, code)
        await self.redis.setex(self.RATE_KEY.format(phone=phone), settings.otp_rate_limit_seconds, "1")
        await self.redis.delete(self.ATTEMPTS_KEY.format(phone=phone))

        expires_at = _utcnow() + timedelta(seconds=ttl)
        self.db.add(OtpCode(phone=phone, code=code, expires_at=expires_at))
        await self.db.commit()

        if settings.debug:
            logger.info("OTP for %s: %s (dev mock)", phone, code)
        else:
            logger.info("OTP sent to %s", phone)

        return OtpSendResponse(message="Код отправлен на указанный номер")

    async def verify_otp(self, payload: OtpVerifyRequest) -> bool:
        phone = payload.phone
        code = payload.code.strip()

        if settings.debug and code == settings.otp_mock_code:
            return True

        attempts_key = self.ATTEMPTS_KEY.format(phone=phone)
        attempts = int(await self.redis.get(attempts_key) or 0)
        if attempts >= settings.otp_max_attempts:
            raise ValueError("Превышено число попыток. Запросите новый код.")

        stored = await self.redis.get(self.OTP_KEY.format(phone=phone))
        if not stored or stored != code:
            await self.redis.setex(
                attempts_key,
                settings.otp_ttl_seconds,
                str(attempts + 1),
            )
            raise ValueError("Неверный код подтверждения")

        await self.redis.delete(self.OTP_KEY.format(phone=phone))
        await self.redis.delete(attempts_key)

        result = await self.db.execute(
            select(OtpCode)
            .where(OtpCode.phone == phone, OtpCode.verified_at.is_(None))
            .order_by(OtpCode.created_at.desc())
            .limit(1)
        )
        otp_record = result.scalar_one_or_none()
        if otp_record:
            otp_record.verified_at = _utcnow()
            await self.db.commit()

        return True


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_refresh_token(self, user_id: UUID) -> str:
        token = secrets.token_urlsafe(48)
        expires_at = _utcnow() + timedelta(days=settings.refresh_token_expire_days)
        self.db.add(
            RefreshToken(
                user_id=user_id,
                token_hash=_hash_token(token),
                expires_at=expires_at,
            )
        )
        await self.db.commit()
        return token

    async def get_or_create_user(self, phone: str) -> User:
        result = await self.db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()
        if user:
            return user
        user = User(phone=phone)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def verify_and_issue_tokens(self, payload: OtpVerifyRequest) -> TokenResponse:
        user = await self.get_or_create_user(payload.phone)
        access = create_access_token(user.id)
        refresh = await self.create_refresh_token(user.id)
        return TokenResponse(
            access_token=access,
            refresh_token=refresh,
            user=UserResponse.model_validate(user),
        )

    async def refresh_tokens(self, payload: RefreshRequest) -> RefreshResponse:
        token_hash = _hash_token(payload.refresh_token)
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
        )
        stored = result.scalar_one_or_none()
        if not stored:
            raise ValueError("Invalid or expired refresh token")
        expires = stored.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        if expires < _utcnow():
            raise ValueError("Invalid or expired refresh token")

        stored.revoked_at = _utcnow()
        access = create_access_token(stored.user_id)
        new_refresh = await self.create_refresh_token(stored.user_id)
        await self.db.commit()
        return RefreshResponse(access_token=access, refresh_token=new_refresh)

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
        return result.scalar_one_or_none()


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_profile(self, user_id: UUID) -> UserResponse:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        return UserResponse.model_validate(user)

    async def update_profile(self, user_id: UUID, payload: UserUpdateRequest) -> UserResponse:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        if payload.name is not None:
            user.name = payload.name
        await self.db.commit()
        await self.db.refresh(user)
        return UserResponse.model_validate(user)


class AddressService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_addresses(self, user_id: UUID) -> list[AddressResponse]:
        result = await self.db.execute(
            select(Address).where(Address.user_id == user_id).order_by(Address.is_default.desc(), Address.created_at)
        )
        return [AddressResponse.model_validate(a) for a in result.scalars().all()]

    async def create_address(self, user_id: UUID, payload: AddressCreate) -> AddressResponse:
        if payload.is_default:
            await self.db.execute(
                update(Address).where(Address.user_id == user_id).values(is_default=False)
            )
        address = Address(
            user_id=user_id,
            label=payload.label,
            address=payload.address,
            is_default=payload.is_default,
        )
        self.db.add(address)
        await self.db.commit()
        await self.db.refresh(address)
        return AddressResponse.model_validate(address)

    async def get_address(self, user_id: UUID, address_id: UUID) -> AddressResponse | None:
        result = await self.db.execute(
            select(Address).where(Address.id == address_id, Address.user_id == user_id)
        )
        address = result.scalar_one_or_none()
        return AddressResponse.model_validate(address) if address else None

    async def update_address(
        self, user_id: UUID, address_id: UUID, payload: AddressUpdate
    ) -> AddressResponse | None:
        result = await self.db.execute(
            select(Address).where(Address.id == address_id, Address.user_id == user_id)
        )
        address = result.scalar_one_or_none()
        if not address:
            return None
        if payload.is_default is True:
            await self.db.execute(
                update(Address).where(Address.user_id == user_id, Address.id != address_id).values(is_default=False)
            )
        if payload.label is not None:
            address.label = payload.label
        if payload.address is not None:
            address.address = payload.address
        if payload.is_default is not None:
            address.is_default = payload.is_default
        await self.db.commit()
        await self.db.refresh(address)
        return AddressResponse.model_validate(address)

    async def delete_address(self, user_id: UUID, address_id: UUID) -> bool:
        result = await self.db.execute(
            select(Address).where(Address.id == address_id, Address.user_id == user_id)
        )
        address = result.scalar_one_or_none()
        if not address:
            return False
        await self.db.delete(address)
        await self.db.commit()
        return True
