from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.dependencies import get_current_user_id, get_redis
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
from app.services import AddressService, AuthService, OtpService, UserService

router = APIRouter(prefix="/api/v1")


@router.post("/auth/otp/send", response_model=OtpSendResponse)
async def send_otp(
    payload: OtpSendRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    service = OtpService(redis, db)
    try:
        return await service.send_otp(payload)
    except ValueError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc


@router.post("/auth/otp/verify", response_model=TokenResponse)
async def verify_otp(
    payload: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    otp_service = OtpService(redis, db)
    auth_service = AuthService(db)
    try:
        await otp_service.verify_otp(payload)
        return await auth_service.verify_and_issue_tokens(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/auth/refresh", response_model=RefreshResponse)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        return await auth_service.refresh_tokens(payload)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/users/me", response_model=UserResponse)
async def get_me(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    try:
        return await service.get_profile(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/users/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdateRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    try:
        return await service.update_profile(user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/users/me/addresses", response_model=list[AddressResponse])
async def list_addresses(
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await AddressService(db).list_addresses(user_id)


@router.post("/users/me/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    payload: AddressCreate,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await AddressService(db).create_address(user_id, payload)


@router.get("/users/me/addresses/{address_id}", response_model=AddressResponse)
async def get_address(
    address_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await AddressService(db).get_address(user_id, address_id)
    if not result:
        raise HTTPException(status_code=404, detail="Address not found")
    return result


@router.patch("/users/me/addresses/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: UUID,
    payload: AddressUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await AddressService(db).update_address(user_id, address_id, payload)
    if not result:
        raise HTTPException(status_code=404, detail="Address not found")
    return result


@router.delete("/users/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    deleted = await AddressService(db).delete_address(user_id, address_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Address not found")
