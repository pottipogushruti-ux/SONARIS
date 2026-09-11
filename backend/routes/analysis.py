"""
SONARIS /analyze route

Workflow: Upload -> Validate -> Mission ID -> Save original -> Preprocess ->
AI/DEMO inference -> Confidence filter -> Risk -> Geolocation -> Save DB ->
Annotated image -> JSON response.
"""
import logging
import os
import time
import uuid

import cv2
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

import models
import schemas
from ai.model_loader import model_info
from config import (
    ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, CONFIDENCE_THRESHOLD,
    MAX_UPLOAD_SIZE_BYTES, RISK_DISCLAIMER, CONFIDENCE_DISCLAIMER,
    UPLOADS_DIR,
)
from database import get_db
from services.detection import (
    apply_confidence_filter, detect_objects, generate_annotated_image,
)
from services.geolocation import extract_gps, simulate_location
from services.preprocessing import preprocess_image
from services.risk import calculate_risk

logger = logging.getLogger("sonaris.routes.analysis")
router = APIRouter(tags=["Analysis"])


def _new_mission_id() -> str:
    return f"SONARIS-{uuid.uuid4().hex[:8].upper()}"


def _validate_upload(file: UploadFile, contents: bytes):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "UNSUPPORTED_FORMAT",
                "message": f"File extension '{ext}' is not supported. "
                           f"Allowed: {sorted(ALLOWED_EXTENSIONS)}",
            },
        )

    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        logger.warning("MIME type %s not in allow-list for %s; proceeding on extension check.",
                        file.content_type, file.filename)

    if len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_IMAGE", "message": "Uploaded file is empty."},
        )

    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "error": "FILE_TOO_LARGE",
                "message": f"File exceeds maximum allowed size of "
                           f"{MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
            },
        )


@router.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze_image(
    file: UploadFile = File(...),
    demo_geolocation: bool = Query(
        False,
        description="If true and no real GPS metadata is found, generate a "
                    "clearly-labelled SIMULATED coordinate for demo purposes.",
    ),
    db: Session = Depends(get_db),
):
    start = time.perf_counter()

    contents = await file.read()
    _validate_upload(file, contents)

    mission_id = _new_mission_id()
    ext = os.path.splitext(file.filename)[1].lower()
    safe_name = f"{mission_id}{ext}"
    saved_path = os.path.join(UPLOADS_DIR, safe_name)

    with open(saved_path, "wb") as f:
        f.write(contents)

    # Verify it's actually a readable image (protects against renamed non-images)
    check = cv2.imread(saved_path)
    if check is None:
        os.remove(saved_path)
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_IMAGE",
                "message": "The uploaded file could not be read as a valid image.",
            },
        )

    # --- Preprocessing ---------------------------------------------------
    try:
        stages = preprocess_image(saved_path, mission_id)
    except Exception as exc:
        logger.exception("Preprocessing failed for mission %s", mission_id)
        raise HTTPException(
            status_code=500,
            detail={"error": "PREPROCESSING_FAILED", "message": str(exc)},
        )

    # --- Inference ---------------------------------------------------------
    try:
        raw_detections, analysis_mode = detect_objects(stages["normalized"])
    except Exception as exc:
        logger.exception("Detection failed for mission %s", mission_id)
        raise HTTPException(
            status_code=500,
            detail={"error": "DETECTION_FAILED", "message": str(exc)},
        )

    filtered = apply_confidence_filter(raw_detections, CONFIDENCE_THRESHOLD)

    # --- Geolocation -----------------------------------------------------
    lat, lon, location_source = extract_gps(saved_path)
    if location_source == "UNAVAILABLE" and demo_geolocation:
        lat, lon, location_source = simulate_location(mission_id)

    # --- Risk + verification status, then persist -----------------------
    enriched = []
    for d in filtered:
        verification_status = (
            "REQUIRES_EXPERT_REVIEW"
            if d["confidence"] < (CONFIDENCE_THRESHOLD + 0.15)
            else "AI_DETECTED"
        )
        risk = calculate_risk(d["object_class"], d["confidence"], verification_status)
        enriched.append({
            **d,
            "risk": risk,
            "verification_status": verification_status,
            "latitude": lat,
            "longitude": lon,
            "location_source": location_source,
        })

    # --- Annotated image ---------------------------------------------------
    # Drawn on the original color image (same pixel dimensions as the
    # normalized image used for detection) for a clearer visual result.
    try:
        annotated_path = generate_annotated_image(stages["original"], mission_id, enriched)
    except Exception as exc:
        logger.exception("Annotation failed for mission %s", mission_id)
        raise HTTPException(
            status_code=500,
            detail={"error": "ANNOTATION_FAILED", "message": str(exc)},
        )

    processing_time_ms = int((time.perf_counter() - start) * 1000)

    # --- Persist to DB ---------------------------------------------------
    try:
        mission = models.Mission(
            mission_id=mission_id,
            image_name=file.filename,
            analysis_mode=analysis_mode,
            processing_time_ms=processing_time_ms,
            location_source=location_source,
        )
        db.add(mission)
        db.flush()

        db_detections = []
        for d in enriched:
            x, y, w, h = d["bbox"]
            det = models.Detection(
                mission_id=mission_id,
                object_class=d["object_class"],
                confidence=d["confidence"],
                risk=d["risk"],
                bbox_x=x, bbox_y=y, bbox_width=w, bbox_height=h,
                latitude=d["latitude"],
                longitude=d["longitude"],
                location_source=d["location_source"],
                verification_status=d["verification_status"],
                analysis_mode=analysis_mode,
            )
            db.add(det)
            db_detections.append(det)

        db.commit()
        for det in db_detections:
            db.refresh(det)

    except Exception as exc:
        db.rollback()
        logger.exception("Database write failed for mission %s", mission_id)
        raise HTTPException(
            status_code=500,
            detail={"error": "DATABASE_ERROR", "message": str(exc)},
        )

    def _to_url(p: str) -> str:
        return f"/files/{mission_id}/{os.path.basename(p)}"

    return schemas.AnalyzeResponse(
        mission_id=mission_id,
        image_name=file.filename,
        analysis_mode=analysis_mode,
        processing_time_ms=processing_time_ms,
        model=schemas.ModelInfo(**model_info()),
        images=schemas.ImageSet(
            original=_to_url(stages["original"]),
            denoised=_to_url(stages["denoised"]),
            enhanced=_to_url(stages["enhanced"]),
            normalized=_to_url(stages["normalized"]),
            annotated=_to_url(annotated_path),
        ),
        detections=[schemas.DetectionOut.from_orm_detection(d) for d in db_detections],
        disclaimers={
            "risk": RISK_DISCLAIMER,
            "confidence": CONFIDENCE_DISCLAIMER,
        },
    )
