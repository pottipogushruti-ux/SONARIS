"""
SONARIS Missions routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(tags=["Missions"])


def _verification_summary(db: Session, mission_id: str) -> dict:
    rows = (
        db.query(models.Detection.verification_status, func.count(models.Detection.id))
        .filter(models.Detection.mission_id == mission_id)
        .group_by(models.Detection.verification_status)
        .all()
    )
    return {status: count for status, count in rows}


@router.get("/missions", response_model=list[schemas.MissionSummary])
def list_missions(db: Session = Depends(get_db)):
    missions = db.query(models.Mission).order_by(models.Mission.created_at.desc()).all()

    out = []
    for m in missions:
        detections = m.detections
        out.append(schemas.MissionSummary(
            mission_id=m.mission_id,
            image_name=m.image_name,
            timestamp=m.timestamp,
            analysis_mode=m.analysis_mode,
            detection_count=len(detections),
            high_risk_count=sum(1 for d in detections if d.risk == "HIGH"),
            verification_summary=_verification_summary(db, m.mission_id),
        ))
    return out


@router.get("/missions/{mission_id}", response_model=schemas.MissionDetail)
def get_mission(mission_id: str, db: Session = Depends(get_db)):
    m = db.query(models.Mission).filter(models.Mission.mission_id == mission_id).first()
    if not m:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "message": f"Mission {mission_id} not found."},
        )

    detections = m.detections
    return schemas.MissionDetail(
        mission_id=m.mission_id,
        image_name=m.image_name,
        timestamp=m.timestamp,
        analysis_mode=m.analysis_mode,
        detection_count=len(detections),
        high_risk_count=sum(1 for d in detections if d.risk == "HIGH"),
        verification_summary=_verification_summary(db, m.mission_id),
        processing_time_ms=m.processing_time_ms,
        location_source=m.location_source,
        detections=[schemas.DetectionOut.from_orm_detection(d) for d in detections],
    )


@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    total_images = db.query(func.count(models.Mission.id)).scalar() or 0
    total_objects = db.query(func.count(models.Detection.id)).scalar() or 0
    high_risk = (
        db.query(func.count(models.Detection.id))
        .filter(models.Detection.risk == "HIGH")
        .scalar() or 0
    )
    verified = (
        db.query(func.count(models.Detection.id))
        .filter(models.Detection.verification_status == "VERIFIED_BY_OPERATOR")
        .scalar() or 0
    )
    pending = (
        db.query(func.count(models.Detection.id))
        .filter(models.Detection.verification_status == "REQUIRES_EXPERT_REVIEW")
        .scalar() or 0
    )
    avg_time = db.query(func.avg(models.Mission.processing_time_ms)).scalar() or 0.0

    return schemas.DashboardStats(
        total_images_analyzed=total_images,
        total_objects_detected=total_objects,
        high_risk_objects=high_risk,
        verified_detections=verified,
        pending_reviews=pending,
        average_processing_time_ms=round(float(avg_time), 2),
        is_demo_data=False,
    )
