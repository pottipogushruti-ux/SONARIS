"""
SONARIS Verification route

Allows a human operator to CONFIRM, REJECT, or flag a detection for REVIEW.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.risk import calculate_risk

router = APIRouter(tags=["Verification"])

DECISION_MAP = {
    "CONFIRM": "VERIFIED_BY_OPERATOR",
    "REJECT": "REJECTED",
    "REVIEW": "REQUIRES_EXPERT_REVIEW",
}


@router.post("/verify", response_model=schemas.VerifyResponse)
def verify_detection(payload: schemas.VerifyRequest, db: Session = Depends(get_db)):
    det = db.query(models.Detection).filter(models.Detection.id == payload.detection_id).first()
    if not det:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NOT_FOUND",
                "message": f"Detection {payload.detection_id} not found.",
            },
        )

    new_status = DECISION_MAP[payload.decision]
    det.verification_status = new_status
    # Re-run risk calculation since verification status can affect priority.
    det.risk = calculate_risk(det.object_class, det.confidence, new_status)

    verification = models.Verification(
        detection_id=det.id,
        decision=payload.decision,
        notes=payload.notes,
        verified_by=payload.verified_by,
    )
    db.add(verification)

    try:
        db.commit()
        db.refresh(det)
        db.refresh(verification)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"error": "DATABASE_ERROR", "message": str(exc)},
        )

    return schemas.VerifyResponse(
        detection_id=det.id,
        verification_status=det.verification_status,
        decision=payload.decision,
        notes=payload.notes,
        timestamp=verification.timestamp,
    )
