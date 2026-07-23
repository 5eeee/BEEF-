import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.consumers import EventConsumer, connect_rabbitmq
from app.routes import router
from app.schemas import HealthResponse

logging.basicConfig(level=settings.debug and logging.DEBUG or logging.INFO)
logger = logging.getLogger(__name__)

rabbitmq_connection = None
event_consumer: EventConsumer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rabbitmq_connection, event_consumer

    rabbitmq_connection = await connect_rabbitmq()
    if rabbitmq_connection:
        event_consumer = EventConsumer(rabbitmq_connection)
        await event_consumer.start()

    yield

    if rabbitmq_connection:
        await rabbitmq_connection.close()


app = FastAPI(
    title="Integration Service",
    description="CRM интеграции и sync logs Beefshteks",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(router)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    return HealthResponse()


@app.get("/", tags=["system"])
async def root():
    return {"service": settings.app_name, "docs": "/docs"}
