from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "identity-service"
    version: str = "0.1.0"


class OtpSendRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) == 11 and digits.startswith("7"):
            return f"+{digits}"
        if len(digits) == 10:
            return f"+7{digits}"
        if len(digits) == 11 and digits.startswith("8"):
            return f"+7{digits[1:]}"
        raise ValueError("Invalid phone number")


class OtpSendResponse(BaseModel):
    success: bool = True
    message: str = "Код отправлен"


class OtpVerifyRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    code: str = Field(..., min_length=4, max_length=8)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        return OtpSendRequest.normalize_phone(v)


class UserResponse(BaseModel):
    id: UUID
    phone: str
    name: str | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class UserUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=128)


class AddressCreate(BaseModel):
    label: str | None = Field(None, max_length=64)
    address: str = Field(..., min_length=5, max_length=512)
    is_default: bool = False


class AddressUpdate(BaseModel):
    label: str | None = Field(None, max_length=64)
    address: str | None = Field(None, min_length=5, max_length=512)
    is_default: bool | None = None


class AddressResponse(BaseModel):
    id: UUID
    label: str | None
    address: str
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}
