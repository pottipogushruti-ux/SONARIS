"""
SONARIS Detections routes
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(tags=["Detections"])


@router.get("/detections", response_model=list[schemas.DetectionOut])
def list_detections(
    search: Optional[str] = Query(None, description="Free-text search on object_class"),
    risk: Optional[str] = Query(None, description="Filter by risk: HIGH | MEDIUM | LOW"),
    verification_status: Optional[str] = Query(None),
    mission_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Detection)

    if search:
        q = q.filter(models.Detection.object_class.ilike(f"%{search}%"))
    if risk:
        q = q.filter(models.Detection.risk == risk.upper())
    if verification_status:
        q = q.filter(models.Detection.verification_status == verification_status.upper())
    if mission_id:
        q = q.filter(models.Detection.mission_id == mission_id)

    results = q.order_by(models.Detection.timestamp.desc()).all()
    return [schemas.DetectionOut.from_orm_detection(d) for d in results]


@router.get("/detections/{detection_id}", response_model=schemas.DetectionOut)
def get_detection(detection_id: int, db: Session = Depends(get_db)):
    det = db.query(models.Detection).filter(models.Detection.id == detection_id).first()
    if not det:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "message": f"Detection {detection_id} not found."},
        )
    return schemas.DetectionOut.from_orm_detection(det)
