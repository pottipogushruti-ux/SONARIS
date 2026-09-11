"""
SONARIS Configuration
All tunable parameters are sourced from environment variables where practical,
with sane defaults for local development.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# --- Directories -----------------------------------------------------------
UPLOADS_DIR = BASE_DIR / "uploads"
PROCESSED_DIR = BASE_DIR / "processed"
REPORTS_DIR = BASE_DIR / "reports"
AI_MODELS_DIR = BASE_DIR / "ai" / "models"

for _d in (UPLOADS_DIR, PROCESSED_DIR, REPORTS_DIR, AI_MODELS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# --- Database ----------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'sonaris.db'}")

# --- Upload constraints ------------------------------------------------
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/tiff", "image/x-tiff",
}

# --- AI model ------------------------------------------------------------
MODEL_PATH = os.getenv("MODEL_PATH", str(AI_MODELS_DIR / "sonaris.pt"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.40"))

DETECTION_CLASSES = [
    "Shipwreck",
    "Submarine Pipeline",
    "Ghost Net",
    "Mine/Cylinder-like Object",
    "Marine Debris",
    "Unknown Anomaly",
    "Natural Seabed Feature",
]

HAZARDOUS_CLASSES = {"Mine/Cylinder-like Object", "Shipwreck", "Ghost Net"}

# --- CORS ----------------------------------------------------------------
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
).split(",")

# --- Misc ------------------------------------------------------------------
ENV = os.getenv("ENV", "development")  # "development" or "production"
API_VERSION = "1.0.0"
SYSTEM_NAME = "SONARIS"

RISK_DISCLAIMER = (
    "Risk score is an operational prioritization aid and is not a certified "
    "maritime safety assessment."
)
CONFIDENCE_DISCLAIMER = (
    "Confidence represents model confidence and does not prove object identity."
)
HISTORICAL_DISCLAIMER = (
    "SONARIS was not used in historical incidents referenced by the "
    "application unless explicitly stated."
)
