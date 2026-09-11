"""
SONARIS Backend Test Suite

Run with:  pytest -v   (from the backend/ directory)

Uses a dedicated on-disk SQLite test database so it never touches your
development database, and a synthetic in-memory PNG so no external test
assets are required.
"""
import io
import os
import sys

import numpy as np
import cv2
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --- Point the app at an isolated test database BEFORE importing it --------
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_sonaris.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from main import app  # noqa: E402
from database import init_db  # noqa: E402

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()
    yield
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def _make_test_image_bytes() -> bytes:
    """Builds a synthetic sonar-like grayscale image with a few blobs."""
    img = np.random.default_rng(7).normal(90, 12, (300, 400)).astype(np.uint8)
    cv2.circle(img, (100, 100), 15, 220, -1)
    cv2.rectangle(img, (250, 180), (350, 195), 210, -1)
    ok, buf = cv2.imencode(".png", img)
    assert ok
    return buf.tobytes()


def _make_invalid_file_bytes() -> bytes:
    return b"this is not an image, just plain text bytes"


# --- Health -----------------------------------------------------------------
def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "online"
    assert body["system"] == "SONARIS"


# --- Upload / analyze ---------------------------------------------------
def test_analyze_valid_image():
    img_bytes = _make_test_image_bytes()
    resp = client.post(
        "/analyze",
        files={"file": ("test_sonar.png", img_bytes, "image/png")},
    )
    assert resp.status_code == 200
    body = resp.json()

    assert body["mission_id"].startswith("SONARIS-")
    assert body["analysis_mode"] in ("AI_INFERENCE", "DEMO_INFERENCE")
    assert "processing_time_ms" in body
    assert set(body["images"].keys()) == {
        "original", "denoised", "enhanced", "normalized", "annotated"
    }
    assert isinstance(body["detections"], list)
    for det in body["detections"]:
        assert 0.0 <= det["confidence"] <= 1.0
        assert det["risk"] in ("HIGH", "MEDIUM", "LOW")
        assert det["analysis_mode"] == body["analysis_mode"]

    # Stash for downstream tests
    pytest.mission_id = body["mission_id"]
    pytest.detection_id = body["detections"][0]["id"] if body["detections"] else None


def test_analyze_invalid_file_rejected():
    bad_bytes = _make_invalid_file_bytes()
    resp = client.post(
        "/analyze",
        files={"file": ("not_an_image.png", bad_bytes, "image/png")},
    )
    assert resp.status_code == 400
    body = resp.json()
    assert "error" in body


def test_analyze_unsupported_extension_rejected():
    resp = client.post(
        "/analyze",
        files={"file": ("data.txt", b"hello", "text/plain")},
    )
    assert resp.status_code == 400
    assert resp.json()["error"] == "UNSUPPORTED_FORMAT"


# --- Preprocessing artifacts ----------------------------------------------
def test_preprocessing_files_exist_on_disk():
    from config import PROCESSED_DIR
    mission_dir = os.path.join(PROCESSED_DIR, pytest.mission_id)
    for stage in ("original.png", "denoised.png", "enhanced.png", "normalized.png", "annotated.png"):
        assert os.path.exists(os.path.join(mission_dir, stage))


def test_static_files_served():
    resp = client.get(f"/files/{pytest.mission_id}/original.png")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("image/")


# --- Detections --------------------------------------------------------------
def test_get_detections_list():
    resp = client.get("/detections")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_get_detections_filtered_by_risk():
    resp = client.get("/detections", params={"risk": "LOW"})
    assert resp.status_code == 200
    for det in resp.json():
        assert det["risk"] == "LOW"


def test_get_single_detection():
    if not pytest.detection_id:
        pytest.skip("No detections produced for synthetic test image.")
    resp = client.get(f"/detections/{pytest.detection_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == pytest.detection_id


def test_get_detection_not_found():
    resp = client.get("/detections/999999")
    assert resp.status_code == 404


# --- Missions ------------------------------------------------------------
def test_get_missions_list():
    resp = client.get("/missions")
    assert resp.status_code == 200
    mission_ids = [m["mission_id"] for m in resp.json()]
    assert pytest.mission_id in mission_ids


def test_get_mission_detail():
    resp = client.get(f"/missions/{pytest.mission_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["mission_id"] == pytest.mission_id
    assert "detections" in body


def test_get_mission_not_found():
    resp = client.get("/missions/SONARIS-DOESNOTEXIST")
    assert resp.status_code == 404


# --- Verification -----------------------------------------------------------
def test_verify_detection():
    if not pytest.detection_id:
        pytest.skip("No detections produced for synthetic test image.")
    resp = client.post("/verify", json={
        "detection_id": pytest.detection_id,
        "decision": "CONFIRM",
        "notes": "Looks like a real object.",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["verification_status"] == "VERIFIED_BY_OPERATOR"

    # Confirm the change persisted
    follow_up = client.get(f"/detections/{pytest.detection_id}")
    assert follow_up.json()["verification_status"] == "VERIFIED_BY_OPERATOR"


def test_verify_invalid_decision_rejected():
    if not pytest.detection_id:
        pytest.skip("No detections produced for synthetic test image.")
    resp = client.post("/verify", json={
        "detection_id": pytest.detection_id,
        "decision": "MAYBE",
    })
    assert resp.status_code == 422


def test_verify_unknown_detection():
    resp = client.post("/verify", json={
        "detection_id": 999999,
        "decision": "CONFIRM",
    })
    assert resp.status_code == 404


# --- Reports -----------------------------------------------------------
def test_pdf_report_generation():
    resp = client.get(f"/report/{pytest.mission_id}")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert len(resp.content) > 1000  # a real, non-trivial PDF was generated


def test_csv_report_generation():
    resp = client.get(f"/report/{pytest.mission_id}/csv")
    assert resp.status_code == 200
    assert "mission_id" in resp.text
    assert pytest.mission_id in resp.text


def test_json_report_generation():
    resp = client.get(f"/report/{pytest.mission_id}/json")
    assert resp.status_code == 200
    body = resp.json()
    assert body["mission_id"] == pytest.mission_id


def test_report_not_found():
    resp = client.get("/report/SONARIS-DOESNOTEXIST")
    assert resp.status_code == 404


# --- Dashboard -----------------------------------------------------------
def test_dashboard_stats():
    resp = client.get("/dashboard/stats")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_images_analyzed"] >= 1
    assert body["is_demo_data"] is False
