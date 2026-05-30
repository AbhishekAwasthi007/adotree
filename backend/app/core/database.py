from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event, text
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
)

# Set search_path on every new connection so all DDL and queries use the correct schema
@event.listens_for(engine.sync_engine, "connect")
def set_search_path(dbapi_conn, connection_record):
    if settings.DB_SCHEMA:
        cursor = dbapi_conn.cursor()
        cursor.execute(f'SET search_path TO "{settings.DB_SCHEMA}"')
        cursor.close()

# Async session factory
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base class for declarative SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Dependency injection helper to get async session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
