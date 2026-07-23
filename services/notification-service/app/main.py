import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.consumers import EventConsumer, connect_rabbitmq
from app.database import SessionLocal
from app.routes import router
from app.schemas import HealthResponse
from app.services import NotificationService

logging.basicConfig(level=settings.debug and logging.DEBUG or logging.INFO)
logger = logging.getLogger(__name__)

rabbitmq_connection = None
event_consumer: EventConsumer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rabbitmq_connection, event_consumer

    async with SessionLocal() as session:
        await NotificationService(session).ensure_default_templates()

    rabbitmq_connection = await connect_rabbitmq()
    if rabbitmq_connection:
        event_consumer = EventConsumer(rabbitmq_connection)
        await event_consumer.start()

    yield

    if rabbitmq_connection:
        await rabbitmq_connection.close()


app = FastAPI(
    title="Notification Service",
    description="SMS и Web Push уведомления Beefshteks",
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

app.include_router(router)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    return HealthResponse()


@app.get("/", tags=["system"])
async def root():
    return {"service": settings.app_name, "docs": "/docs"}
