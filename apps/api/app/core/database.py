from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

# SQLAlchemy Async Engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True if "postgresql" in settings.DATABASE_URL else False
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def init_db():
    async with engine.begin() as conn:
        logger.info("Initializing database schemas...")
        # If postgres, enable vector extension if possible
        if "postgresql" in settings.DATABASE_URL:
            try:
                from sqlalchemy import text
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
            except Exception as e:
                logger.warning(f"Could not enable pgvector extensions directly: {e}")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schemas created successfully.")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise
        finally:
            await session.close()
