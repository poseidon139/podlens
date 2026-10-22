import os
import time
import asyncio
import logging
from collections import defaultdict
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from .config import settings
from .routers import sessions, claims, websocket
from .services.audit_logger import audit_logger

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("podlens.main")

# Sliding window in-memory rate limiter per IP address
_ip_request_timestamps = defaultdict(list)
_heavy_endpoint_timestamps = defaultdict(list)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-time, multimodal podcast companion and fact-checking engine built on Google Cloud Vertex AI and Gemini with Search Grounding."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_guardrails_middleware(request: Request, call_next):
    """
    Ingestion Controls & Guardrail Middleware:
    - Enforces sliding-window rate limits to prevent automated execution abuse.
    - Emits structured telemetry records for incoming API requests.
    - Injects security headers.
    """
    path = request.url.path
    # Exempt static assets, root SPA, websocket probes, and health check from rate limits
    if path in ("/", "/healthz") or request.method in ("HEAD", "OPTIONS") or path.startswith("/assets") or path.startswith("/ws/"):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    one_minute_ago = current_time - 60.0

    # 1. Clean old timestamps for client IP
    _ip_request_timestamps[client_ip] = [
        t for t in _ip_request_timestamps[client_ip] if t > one_minute_ago
    ]

    # 2. General Rate Limiting Check
    if len(_ip_request_timestamps[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
        audit_logger.log_event(
            event_type="RATE_LIMIT_EXCEEDED",
            message=f"Rate limit exceeded for IP {client_ip} on {path}",
            severity="WARNING",
            audit_data={"client_ip": client_ip, "path": path, "limit": settings.RATE_LIMIT_PER_MINUTE}
        )
        return JSONResponse(
            status_code=429,
            content={"detail": "Too Many Requests. Rate limit exceeded to ensure service stability. Please retry in 60s."},
            headers={"Retry-After": "60", "X-RateLimit-Limit": str(settings.RATE_LIMIT_PER_MINUTE)}
        )

    # 3. Heavy Endpoint Rate Limiting (e.g. on-demand AI grounding endpoints)
    if "/verify" in path or "/analyze_segment" in path:
        _heavy_endpoint_timestamps[client_ip] = [
            t for t in _heavy_endpoint_timestamps[client_ip] if t > one_minute_ago
        ]
        if len(_heavy_endpoint_timestamps[client_ip]) >= settings.VERIFY_RATE_LIMIT_PER_MINUTE:
            audit_logger.log_event(
                event_type="HEAVY_ENDPOINT_RATE_LIMIT_EXCEEDED",
                message=f"Heavy AI verification rate limit exceeded for IP {client_ip}",
                severity="WARNING",
                audit_data={"client_ip": client_ip, "path": path, "limit": settings.VERIFY_RATE_LIMIT_PER_MINUTE}
            )
            return JSONResponse(
                status_code=429,
                content={"detail": "On-demand verification rate limit reached. Please wait before triggering additional grounding checks."},
                headers={"Retry-After": "60", "X-RateLimit-Limit": str(settings.VERIFY_RATE_LIMIT_PER_MINUTE)}
            )
        _heavy_endpoint_timestamps[client_ip].append(current_time)

    _ip_request_timestamps[client_ip].append(current_time)

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    return response

@app.on_event("startup")
async def on_startup():
    logger.info("PodLens production application started successfully. Listening for requests.")

# API Routers
app.include_router(sessions.router, prefix=settings.API_V1_STR)
app.include_router(claims.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router)

@app.get("/healthz", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "gcp_project": settings.GCP_PROJECT_ID or "mock-demo-mode",
        "demo_mode": settings.DEMO_MODE,
        "gemini_model": settings.GEMINI_MODEL,
        "compliance": {
            "safety_settings_configured": True,
            "safety_block_threshold": settings.SAFETY_BLOCK_THRESHOLD,
            "grounding_confidence_threshold_verified": settings.MIN_GROUNDING_CONFIDENCE_VERIFIED,
            "grounding_confidence_threshold_contested": settings.MIN_GROUNDING_CONFIDENCE_CONTESTED,
            "fallback_unverified_enabled": True,
            "rate_limiting_enabled": True,
            "request_timeout_seconds": settings.REQUEST_TIMEOUT_SECONDS,
            "structured_logging_enabled": True,
            "user_feedback_endpoint_enabled": True
        }
    }

# Check if frontend static build exists to serve unified in Cloud Run
frontend_dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")

if os.path.exists(frontend_dist_path):
    assets_dir = os.path.join(frontend_dist_path, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_spa(full_path: str):
        # Don't intercept API or WS paths
        if full_path.startswith("api/") or full_path.startswith("ws/"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist_path, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=200, content={"status": "PodLens API ready"})
else:
    @app.get("/", tags=["Info"])
    def root_info():
        return {
            "app": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs_url": "/docs",
            "api_v1": settings.API_V1_STR,
            "message": "PodLens API is running. Build the frontend or open /docs to test endpoints."
        }
