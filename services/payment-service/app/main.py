import logging
from contextlib import asynccontextmanager

import aio_pika
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from prometheus_fastapi_instrumentator import Instrumentator

from app.config import settings
from app.routes import router
from app.schemas import HealthResponse

logging.basicConfig(level=settings.debug and logging.DEBUG or logging.INFO)
logger = logging.getLogger(__name__)

rabbitmq_connection: aio_pika.RobustConnection | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rabbitmq_connection

    try:
        rabbitmq_connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        logger.info("Connected to RabbitMQ")
    except Exception:
        logger.warning("RabbitMQ unavailable — events will be skipped in dev")

    yield

    if rabbitmq_connection:
        await rabbitmq_connection.close()


app = FastAPI(
    title="Payment Service",
    description="Платежи и интеграция с платёжным шлюзом Beefshteks",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")
FastAPIInstrumentor.instrument_app(app, tracer_provider=trace.get_tracer_provider())


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    return HealthResponse()


@app.get("/", tags=["system"])
async def root():
    return {"service": settings.app_name, "docs": "/docs"}
