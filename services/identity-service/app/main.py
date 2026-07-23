import logging
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware import JWTAuthMiddleware
from app.routes import router
from app.schemas import HealthResponse

logging.basicConfig(level=settings.debug and logging.DEBUG or logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    logger.info("Connected to Redis")
    yield
    await app.state.redis.aclose()


app = FastAPI(
    title="Identity Service",
    description="SMS-авторизация, профили и адреса Beefshteks",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(JWTAuthMiddleware)

app.include_router(router)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    return HealthResponse()


@app.get("/", tags=["system"])
async def root():
    return {"service": settings.app_name, "docs": "/docs"}
