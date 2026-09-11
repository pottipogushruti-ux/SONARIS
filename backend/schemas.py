"""
SONARIS Pydantic Schemas
"""
import datetime as dt
from typing import Optional, List

from pydantic import BaseModel, Field


# --- Shared -----------------------------------------------------------------
class BBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class ModelInfo(BaseModel):
    mode: str  # AI_INFERENCE | DEMO_INFERENCE
    name: str
    version: str


class ImageSet(BaseModel):
    original: str
    denoised: str
    enhanced: str
    normalized: str
    annotated: str


# --- Detections --------------------------------------------------------------
class DetectionOut(BaseModel):
    id: int
    mission_id: str
    object_class: str
    confidence: float
    risk: str
    bbox: BBox
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_source: str
    verification_status: str
    analysis_mode: str
    timestamp: dt.datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_detection(cls, d):
        return cls(
            id=d.id,
            mission_id=d.mission_id,
            object_class=d.object_class,
            confidence=d.confidence,
            risk=d.risk,
            bbox=BBox(x=d.bbox_x, y=d.bbox_y, width=d.bbox_width, height=d.bbox_height),
            latitude=d.latitude,
            longitude=d.longitude,
            location_source=d.location_source,
            verification_status=d.verification_status,
            analysis_mode=d.analysis_mode,
            timestamp=d.timestamp,
        )


# --- Analyze response -------------------------------------------------------
class AnalyzeResponse(BaseModel):
    mission_id: str
    image_name: str
    analysis_mode: str
    processing_time_ms: int
    model: ModelInfo
    images: ImageSet
    detections: List[DetectionOut]
    disclaimers: dict


# --- Missions ------------------------------------------------------------
class MissionSummary(BaseModel):
    mission_id: str
    image_name: str
    timestamp: dt.datetime
    analysis_mode: str
    detection_count: int
    high_risk_count: int
    verification_summary: dict


class MissionDetail(MissionSummary):
    processing_time_ms: int
    location_source: str
    detections: List[DetectionOut]


# --- Verification --------------------------------------------------------
class VerifyRequest(BaseModel):
    detection_id: int
    decision: str = Field(..., pattern="^(CONFIRM|REJECT|REVIEW)$")
    notes: Optional[str] = None
    verified_by: Optional[str] = "operator"


class VerifyResponse(BaseModel):
    detection_id: int
    verification_status: str
    decision: str
    notes: Optional[str] = None
    timestamp: dt.datetime


# --- Dashboard -------------------------------------------------------------
class DashboardStats(BaseModel):
    total_images_analyzed: int
    total_objects_detected: int
    high_risk_objects: int
    verified_detections: int
    pending_reviews: int
    average_processing_time_ms: float
    is_demo_data: bool = False


# --- Errors ------------------------------------------------------------------
class ErrorResponse(BaseModel):
    error: str
    message: str
