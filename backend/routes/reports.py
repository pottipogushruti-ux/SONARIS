"""
SONARIS Report routes - PDF, CSV, JSON export
"""
import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.report import generate_pdf_report

router = APIRouter(tags=["Reports"])


def _get_mission_or_404(db: Session, mission_id: str) -> models.Mission:
    m = db.query(models.Mission).filter(models.Mission.mission_id == mission_id).first()
    if not m:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "message": f"Mission {mission_id} not found."},
        )
    return m


@router.get("/report/{mission_id}")
def get_pdf_report(mission_id: str, db: Session = Depends(get_db)):
    mission = _get_mission_or_404(db, mission_id)
    try:
        pdf_path = generate_pdf_report(mission, mission.detections)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "REPORT_GENERATION_FAILED", "message": str(exc)},
        )
    return FileResponse(
        pdf_path, media_type="application/pdf",
        filename=f"{mission_id}_report.pdf",
    )


@router.get("/report/{mission_id}/csv")
def get_csv_report(mission_id: str, db: Session = Depends(get_db)):
    mission = _get_mission_or_404(db, mission_id)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "mission_id", "image_name", "object_class", "confidence", "risk",
        "latitude", "longitude", "timestamp", "verification_status", "analysis_mode",
    ])
    for d in mission.detections:
        writer.writerow([
            mission.mission_id, mission.image_name, d.object_class, d.confidence,
            d.risk, d.latitude, d.longitude, d.timestamp.isoformat(),
            d.verification_status, d.analysis_mode,
        ])
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={mission_id}_report.csv"},
    )


@router.get("/report/{mission_id}/json")
def get_json_report(mission_id: str, db: Session = Depends(get_db)):
    mission = _get_mission_or_404(db, mission_id)

    detail = schemas.MissionDetail(
        mission_id=mission.mission_id,
        image_name=mission.image_name,
        timestamp=mission.timestamp,
        analysis_mode=mission.analysis_mode,
        detection_count=len(mission.detections),
        high_risk_count=sum(1 for d in mission.detections if d.risk == "HIGH"),
        verification_summary={},
        processing_time_ms=mission.processing_time_ms,
        location_source=mission.location_source,
        detections=[schemas.DetectionOut.from_orm_detection(d) for d in mission.detections],
    )
    return JSONResponse(content=detail.model_dump(mode="json"))
