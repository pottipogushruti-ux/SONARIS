"""
Unit tests for CV/service-layer logic that has no FastAPI/SQLAlchemy
dependency (preprocessing, demo detection, risk, geolocation). These can run
even before installing the web-framework requirements, e.g.:

    pip install opencv-python-headless numpy Pillow reportlab pytest
    pytest tests/test_services.py -v
"""
import os
import sys

import cv2
import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.preprocessing import preprocess_image  # noqa: E402
from ai.demo_detector import detect_candidates  # noqa: E402
from services.risk import calculate_risk  # noqa: E402
from services.geolocation import extract_gps, simulate_location  # noqa: E402


@pytest.fixture
def synthetic_image(tmp_path):
    img = np.random.default_rng(1).normal(90, 12, (300, 400)).astype(np.uint8)
    cv2.circle(img, (100, 100), 15, 220, -1)
    cv2.rectangle(img, (250, 180), (350, 195), 210, -1)
    path = str(tmp_path / "synthetic.png")
    cv2.imwrite(path, img)
    return path


def test_preprocessing_produces_all_stages(synthetic_image, tmp_path):
    import config
    config.PROCESSED_DIR = str(tmp_path / "processed")
    stages = preprocess_image(synthetic_image, "TESTMISSION")
    for stage in ("original", "denoised", "enhanced", "normalized"):
        assert os.path.exists(stages[stage])


def test_preprocessing_rejects_unreadable_file(tmp_path):
    bad_path = tmp_path / "not_an_image.png"
    bad_path.write_bytes(b"not a real image")
    with pytest.raises(ValueError):
        preprocess_image(str(bad_path), "TESTMISSION2")


def test_demo_detector_returns_valid_shape(synthetic_image, tmp_path):
    import config
    config.PROCESSED_DIR = str(tmp_path / "processed")
    stages = preprocess_image(synthetic_image, "TESTMISSION3")
    detections = detect_candidates(stages["normalized"])
    assert isinstance(detections, list)
    for d in detections:
        assert 0.0 <= d["confidence"] <= 1.0
        assert d["object_class"] in {
            "Shipwreck", "Submarine Pipeline", "Ghost Net",
            "Mine/Cylinder-like Object", "Marine Debris",
            "Unknown Anomaly", "Natural Seabed Feature",
        }
        x, y, w, h = d["bbox"]
        assert w > 0 and h > 0


def test_demo_detector_is_deterministic(synthetic_image, tmp_path):
    import config
    config.PROCESSED_DIR = str(tmp_path / "processed")
    stages = preprocess_image(synthetic_image, "TESTMISSION4")
    result_a = detect_candidates(stages["normalized"])
    result_b = detect_candidates(stages["normalized"])
    assert result_a == result_b


def test_risk_hazardous_high_confidence_is_high():
    assert calculate_risk("Mine/Cylinder-like Object", 0.85, "AI_DETECTED") == "HIGH"


def test_risk_natural_seabed_is_low():
    assert calculate_risk("Natural Seabed Feature", 0.9, "AI_DETECTED") == "LOW"


def test_risk_verified_hazardous_is_high_even_at_lower_confidence():
    assert calculate_risk("Ghost Net", 0.45, "VERIFIED_BY_OPERATOR") == "HIGH"


def test_geolocation_no_exif_returns_unavailable(synthetic_image):
    lat, lon, source = extract_gps(synthetic_image)
    assert lat is None and lon is None
    assert source == "UNAVAILABLE"


def test_simulated_location_is_deterministic_and_labelled():
    a = simulate_location("SONARIS-ABC123")
    b = simulate_location("SONARIS-ABC123")
    assert a == b
    assert a[2] == "SIMULATED"
