import os
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.core.websocket import manager
from app.api.routes import api_router

# Import all SQLAlchemy models to register them with Base.metadata
from app.models.user import User
from app.models.farmer import Farmer
from app.models.farm import Farm
from app.models.tree import Tree
from app.models.adoption import Adoption
from app.models.ceremony import Ceremony
from app.models.memory import TreeMemory
from app.models.harvest import Harvest
from app.models.delivery import Delivery
from app.models.payment import Payment
from app.models.transaction import Transaction
from app.models.farmer_wallet import FarmerWallet
from app.models.commission import Commission
from app.models.admin_bank_account import AdminBankAccount
from app.models.notification import Notification
from app.models.chat import ChatMessage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Automatic schema initialization for dev
    logger.info("Initializing database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully.")
        
        # Seed initial data
        from app.core.seed import seed_data
        await seed_data()
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}", exc_info=True)

    # 2. Spawn background worker connection for Redis Pub/Sub sync
    logger.info("Starting Redis WebSocket global listener...")
    listener_task = asyncio.create_task(manager.start_redis_listener())

    yield

    # 3. Shutdown cleanup
    logger.info("Shutting down Redis WebSocket global listener...")
    listener_task.cancel()
    try:
        await listener_task
    except asyncio.CancelledError:
        pass
    logger.info("Lifespan shutdown sequence complete.")

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A cinematic sustainability platform where users adopt real trees, name them in naming ceremonies, and track live growth and harvests.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configurations
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Static file serving initialization
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
if not os.path.exists(static_dir):
    os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Register global API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
async def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API!",
        "documentation": "/docs",
        "health": "/health"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.FASTAPI_ENV
    }
