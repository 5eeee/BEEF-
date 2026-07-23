import pytest
from uuid import uuid4

from app.auth import create_access_token, decode_token
from app.schemas import OtpSendRequest, OtpVerifyRequest
from app.services import OtpService


class FakeRedis:
    def __init__(self):
        self.store: dict[str, str] = {}
        self.ttl: dict[str, int] = {}

    async def get(self, key):
        return self.store.get(key)

    async def setex(self, key, ttl, value):
        self.store[key] = value
        self.ttl[key] = ttl

    async def delete(self, key):
        self.store.pop(key, None)
        self.ttl.pop(key, None)

    async def exists(self, key):
        return 1 if key in self.store else 0


class FakeSession:
    def __init__(self):
        self.added = []
        self.committed = False

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.committed = True

    async def execute(self, *_args, **_kwargs):
        class Result:
            def scalar_one_or_none(self):
                return None

        return Result()


@pytest.mark.asyncio
async def test_otp_send_stores_code_in_redis(monkeypatch):
    monkeypatch.setattr("app.services.settings.debug", True)
    redis = FakeRedis()
    db = FakeSession()
    service = OtpService(redis, db)

    result = await service.send_otp(OtpSendRequest(phone="+79991234567"))
    assert result.success is True
    assert redis.store["otp:+79991234567"] == "1234"
    assert db.committed is True


@pytest.mark.asyncio
async def test_otp_verify_accepts_mock_code(monkeypatch):
    monkeypatch.setattr("app.services.settings.debug", True)
    redis = FakeRedis()
    db = FakeSession()
    service = OtpService(redis, db)

    assert await service.verify_otp(OtpVerifyRequest(phone="+79991234567", code="1234")) is True


@pytest.mark.asyncio
async def test_otp_verify_rejects_wrong_code(monkeypatch):
    monkeypatch.setattr("app.services.settings.debug", False)
    redis = FakeRedis()
    await redis.setex("otp:+79991234567", 300, "5678")
    db = FakeSession()
    service = OtpService(redis, db)

    with pytest.raises(ValueError, match="Неверный код"):
        await service.verify_otp(OtpVerifyRequest(phone="+79991234567", code="0000"))


def test_jwt_roundtrip():
    user_id = uuid4()
    token = create_access_token(user_id)
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == str(user_id)


def test_jwt_rejects_wrong_type():
    user_id = uuid4()
    token = create_access_token(user_id)
    with pytest.raises(ValueError, match="Invalid token type"):
        decode_token(token, expected_type="refresh")
