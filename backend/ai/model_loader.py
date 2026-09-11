"""
SONARIS Model Loader

Responsible for determining whether a valid trained YOLO model is available.
If not, the system falls back to DEMO_INFERENCE. This module never crashes
the server — any loading failure is logged and treated as "no model".
"""
import logging
import os

from config import MODEL_PATH

logger = logging.getLogger("sonaris.ai.model_loader")

_model_cache = {"loaded": False, "model": None, "checked": False}


def _try_load_yolo():
    """Attempt to load a YOLO model from MODEL_PATH. Returns the model or None."""
    if not os.path.exists(MODEL_PATH):
        logger.info("No trained model found at MODEL_PATH=%s — using DEMO_INFERENCE.", MODEL_PATH)
        return None

    try:
        from ultralytics import YOLO  # imported lazily so the package is optional
    except ImportError:
        logger.warning(
            "ultralytics package not installed — cannot load MODEL_PATH=%s. "
            "Falling back to DEMO_INFERENCE.", MODEL_PATH
        )
        return None

    try:
        model = YOLO(MODEL_PATH)
        logger.info("Loaded trained YOLO model from %s", MODEL_PATH)
        return model
    except Exception as exc:  # noqa: BLE001 - any load failure must degrade safely
        logger.warning(
            "Failed to load YOLO model at %s (%s). Falling back to DEMO_INFERENCE.",
            MODEL_PATH, exc,
        )
        return None


def get_model():
    """
    Returns (model, mode) where mode is 'AI_INFERENCE' or 'DEMO_INFERENCE'.
    Result is cached for the process lifetime — restart the server to pick up
    a newly placed model file.
    """
    if not _model_cache["checked"]:
        _model_cache["model"] = _try_load_yolo()
        _model_cache["loaded"] = _model_cache["model"] is not None
        _model_cache["checked"] = True

    if _model_cache["loaded"]:
        return _model_cache["model"], "AI_INFERENCE"
    return None, "DEMO_INFERENCE"


def model_info():
    """Returns a dict describing the currently active inference backend."""
    model, mode = get_model()
    if mode == "AI_INFERENCE":
        return {"mode": mode, "name": os.path.basename(MODEL_PATH), "version": "trained-model"}
    return {"mode": mode, "name": "SONARIS Demo CV Pipeline", "version": "1.0"}
