import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.admin_routes import router as admin_router
from app.routes import router
from app.schemas import HealthResponse
from app.seed import seed_if_empty, sync_search_index

logging.basicConfig(level=settings.debug and logging.DEBUG or logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        seeded = await seed_if_empty()
        if seeded:
            logger.info("Catalog database seeded with mock menu data")
        await asyncio.to_thread(sync_search_index)
        logger.info("Meilisearch index synchronized")
    except Exception as exc:
        logger.warning("Startup init skipped: %s", exc)
    yield


app = FastAPI(
    title="Catalog Service",
    description="Меню, категории, поиск и фильтрация Beefshteks",
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
app.include_router(admin_router)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    return HealthResponse()


@app.get("/", tags=["system"])
async def root():
    return {"service": settings.app_name, "docs": "/docs"}
