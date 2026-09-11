"""
SONARIS Detection Service

Orchestrates: model selection -> inference -> confidence filtering ->
annotated image generation. This is the single entry point routes should
call; it hides whether AI_INFERENCE or DEMO_INFERENCE is active.
"""
import logging
import os

import cv2

from ai.model_loader import get_model
from ai.yolo_detector import run_inference as yolo_run_inference
from ai.demo_detector import detect_candidates as demo_detect_candidates
from config import CONFIDENCE_THRESHOLD, PROCESSED_DIR

logger = logging.getLogger("sonaris.services.detection")

RISK_COLORS_BGR = {
    "HIGH": (0, 0, 255),      # red
    "MEDIUM": (0, 165, 255),  # orange
    "LOW": (0, 200, 0),       # green
}


def detect_objects(normalized_image_path: str):
    """
    Determines whether a valid trained model is available and runs the
    appropriate inference path.

    Returns (raw_detections, analysis_mode) where raw_detections is a list of
    {"object_class", "confidence", "bbox": (x, y, w, h)}.
    """
    model, mode = get_model()

    if mode == "AI_INFERENCE":
        try:
            raw = yolo_run_inference(model, normalized_image_path)
        except Exception as exc:  # noqa: BLE001 - inference failure must degrade, not crash
            logger.error("YOLO inference failed (%s); falling back to DEMO_INFERENCE.", exc)
            raw = demo_detect_candidates(normalized_image_path)
            mode = "DEMO_INFERENCE"
    else:
        raw = demo_detect_candidates(normalized_image_path)

    return raw, mode


def apply_confidence_filter(raw_detections, threshold: float = CONFIDENCE_THRESHOLD):
    """
    Filters out detections below the confidence threshold. Low-confidence
    survivors near the boundary are flagged for expert review by the caller;
    this function itself never mutates confidence values.
    """
    return [d for d in raw_detections if d["confidence"] >= threshold]


def generate_annotated_image(source_image_path: str, mission_id: str, detections: list) -> str:
    """
    Draws bounding boxes + labels (class, confidence %, risk) onto the source
    image and saves it as processed/{mission_id}/annotated.png.
    `detections` is a list of dicts with object_class, confidence, risk, bbox.
    """
    img = cv2.imread(source_image_path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not read image for annotation.")

    for det in detections:
        x, y, w, h = (int(v) for v in det["bbox"])
        risk = det.get("risk", "LOW")
        color = RISK_COLORS_BGR.get(risk, (255, 255, 255))

        cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)

        label_lines = [
            det["object_class"].upper(),
            f"{round(det['confidence'] * 100)}%",
            risk,
        ]
        line_y = max(y - 10, 15)
        for i, line in enumerate(label_lines):
            y_offset = line_y - (len(label_lines) - 1 - i) * 16
            cv2.putText(
                img, line, (x, y_offset),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2, cv2.LINE_AA,
            )

    out_dir = os.path.join(PROCESSED_DIR, mission_id)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "annotated.png")
    cv2.imwrite(out_path, img)
    return out_path
