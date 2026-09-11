"""
SONARIS Database Models
"""
import datetime as dt

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship

from database import Base


class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(String, unique=True, index=True, nullable=False)
    image_name = Column(String, nullable=False)
    timestamp = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    analysis_mode = Column(String, nullable=False)  # AI_INFERENCE | DEMO_INFERENCE
    processing_time_ms = Column(Integer, nullable=False, default=0)
    location_source = Column(String, nullable=False, default="UNAVAILABLE")
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    detections = relationship(
        "Detection", back_populates="mission", cascade="all, delete-orphan"
    )


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(String, ForeignKey("missions.mission_id"), nullable=False, index=True)

    object_class = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    risk = Column(String, nullable=False)  # HIGH | MEDIUM | LOW

    bbox_x = Column(Float, nullable=False)
    bbox_y = Column(Float, nullable=False)
    bbox_width = Column(Float, nullable=False)
    bbox_height = Column(Float, nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_source = Column(String, nullable=False, default="UNAVAILABLE")

    verification_status = Column(String, nullable=False, default="AI_DETECTED")
    analysis_mode = Column(String, nullable=False)
    timestamp = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    mission = relationship("Mission", back_populates="detections")
    verifications = relationship(
        "Verification", back_populates="detection", cascade="all, delete-orphan"
    )


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"), nullable=False, index=True)
    decision = Column(String, nullable=False)  # CONFIRM | REJECT | REVIEW
    notes = Column(Text, nullable=True)
    verified_by = Column(String, nullable=True)
    timestamp = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    detection = relationship("Detection", back_populates="verifications")
