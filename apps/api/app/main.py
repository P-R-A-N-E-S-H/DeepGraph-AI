import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger
from app.core.database import init_db
from app.core.neo4j import neo4j_client
from app.core.redis import redis_client
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting DeepGraph AI API Gateway...")
    await init_db()
    await neo4j_client.connect()
    await redis_client.connect()
    yield
    logger.info("Shutting down DeepGraph AI API Gateway...")
    await neo4j_client.close()
    await redis_client.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Turn research papers into a connected, searchable intelligence graph.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID and Latency Middleware
@app.middleware("http")
async def request_observability_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = req_id
    start_time = time.time()
    
    response = await call_next(request)
    
    latency_ms = round((time.time() - start_time) * 1000.0, 2)
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Response-Time-MS"] = str(latency_ms)
    
    logger.info(
        f"Handled {request.method} {request.url.path} -> {response.status_code} in {latency_ms}ms",
        extra={"request_id": req_id, "latency_ms": latency_ms}
    )
    return response

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True, extra={"request_id": req_id})
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "request_id": req_id}
    )

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
async def root():
    return {
        "message": "Welcome to DeepGraph AI API",
        "tagline": "Turn research papers into a connected, searchable intelligence graph.",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def root_health():
    return {
        "status": "healthy",
        "service": "DeepGraph AI REST Gateway",
        "version": "1.0.0"
    }
