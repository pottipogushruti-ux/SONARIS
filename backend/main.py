"""
SONARIS Backend - AI-Powered Underwater Anomaly Detection System
Smart India Hackathon Problem Statement: SIH26057

Entry point: run with `uvicorn main:app --reload`
"""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import API_VERSION, CORS_ORIGINS, ENV, PROCESSED_DIR, SYSTEM_NAME
from database import init_db
from routes import analysis, detections, missions, reports, verification

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sonaris.main")

app = FastAPI(
    title="SONARIS API",
    description=(
        "AI-Powered Underwater Anomaly Detection System — "
        '"See the Unseen. Filter the Noise. Find the Hazard."\n\n'
        "SIH Problem Statement: SIH26057.\n\n"
        "**Important:** when no trained sonar detection model is configured, "
        "the API runs a clearly labelled DEMO_INFERENCE pipeline instead of "
        "AI_INFERENCE. Always check the `analysis_mode` field."
    ),
    version=API_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    logger.info("SONARIS backend started. ENV=%s", ENV)


# --- Global error handlers ---------------------------------------------------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        body = detail
    else:
        body = {"error": "HTTP_ERROR", "message": str(detail)}
    return JSONResponse(status_code=exc.status_code, content=body)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request validation failed.",
            "details": exc.errors() if ENV != "production" else None,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    body = {"error": "INTERNAL_ERROR", "message": "An unexpected error occurred."}
    if ENV != "production":
        body["details"] = str(exc)
    return JSONResponse(status_code=500, content=body)


# --- Health --------------------------------------------------------------
@app.get("/health", tags=["System"])
def health():
    return {"status": "online", "system": SYSTEM_NAME, "version": API_VERSION}


# --- Routers -----------------------------------------------------------------
app.include_router(analysis.router)
app.include_router(detections.router)
app.include_router(missions.router)
app.include_router(verification.router)
app.include_router(reports.router)

# --- Static file serving for processed images -------------------------------
app.mount("/files", StaticFiles(directory=str(PROCESSED_DIR)), name="files")
