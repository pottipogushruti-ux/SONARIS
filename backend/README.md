# SONARIS Backend

AI-Powered Underwater Anomaly Detection System — *"See the Unseen. Filter the Noise. Find the Hazard."*
Smart India Hackathon Problem Statement: **SIH26057**

A real, working FastAPI backend. No hardcoded fake AI results. When no trained
sonar detection model is configured, the API runs a clearly-labelled
`DEMO_INFERENCE` pipeline instead of pretending to be trained AI — the
`analysis_mode` field on every response tells you exactly which one ran.

---

## 1. Folder structure

```
backend/
├── main.py                # FastAPI app, CORS, error handlers, static files
├── database.py             # SQLAlchemy engine/session
├── models.py               # ORM models: Mission, Detection, Verification
├── schemas.py               # Pydantic request/response models
├── config.py                # Env-driven configuration
├── requirements.txt
│
├── routes/
│   ├── analysis.py          # POST /analyze
│   ├── detections.py        # GET /detections, /detections/{id}
│   ├── missions.py          # GET /missions, /missions/{id}, /dashboard/stats
│   ├── verification.py      # POST /verify
│   └── reports.py           # GET /report/{id}(.pdf|/csv|/json)
│
├── services/
│   ├── preprocessing.py     # OpenCV denoise -> CLAHE -> normalize pipeline
│   ├── detection.py         # Orchestrates AI/DEMO inference + annotation
│   ├── risk.py               # Rule-based risk scoring
│   ├── geolocation.py        # EXIF GPS extraction (never invents coords)
│   └── report.py             # ReportLab PDF generation
│
├── ai/
│   ├── model_loader.py       # Detects if a trained YOLO model is available
│   ├── yolo_detector.py      # Real inference path (only if model loads)
│   └── demo_detector.py      # Deterministic CV fallback (NOT trained AI)
│
├── uploads/                  # Raw uploaded images
├── processed/{mission_id}/   # original/denoised/enhanced/normalized/annotated
├── reports/                  # Generated PDFs
└── tests/
    ├── test_services.py      # Unit tests, no web-framework deps needed
    └── test_api.py           # Full API integration tests (TestClient)
```

---

## 2. Installation

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Optional — to run **real** AI inference instead of the demo pipeline, also install:

```bash
pip install ultralytics
```

## 3. Environment variables

All optional; sensible defaults are used if unset.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./sonaris.db` | SQLAlchemy connection string |
| `MODEL_PATH` | `ai/models/sonaris.pt` | Path to a trained YOLO model. If missing/unloadable, falls back to `DEMO_INFERENCE` automatically. |
| `CONFIDENCE_THRESHOLD` | `0.40` | Detections below this are dropped |
| `MAX_UPLOAD_SIZE_MB` | `20` | Max accepted upload size |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Comma-separated allowed origins |
| `ENV` | `development` | Set to `production` to hide stack traces / error details |

## 4. Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

- Interactive docs: `http://localhost:8001/docs`
- Health check: `http://localhost:8001/health`

## 5. Testing

```bash
# Unit tests only (no FastAPI/SQLAlchemy needed — good smoke test):
pytest tests/test_services.py -v

# Full API integration tests:
pytest tests/test_api.py -v

# Everything:
pytest -v
```

---

## 6. API Contract (for the frontend developer)

All responses are JSON. All errors follow the same shape:

```json
{ "error": "SOME_ERROR_CODE", "message": "Human readable explanation." }
```

Common error codes: `INVALID_IMAGE`, `UNSUPPORTED_FORMAT`, `FILE_TOO_LARGE`,
`PREPROCESSING_FAILED`, `DETECTION_FAILED`, `ANNOTATION_FAILED`,
`DATABASE_ERROR`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`.

### GET /health
```json
{ "status": "online", "system": "SONARIS", "version": "1.0.0" }
```

### POST /analyze
`multipart/form-data`, field name `file`. Optional query param
`demo_geolocation=true` to simulate a coordinate (clearly labelled
`SIMULATED`) when the image has no real GPS EXIF data.

**Response:**
```json
{
  "mission_id": "SONARIS-1A2B3C4D",
  "image_name": "sonar.png",
  "analysis_mode": "DEMO_INFERENCE",
  "processing_time_ms": 812,
  "model": { "mode": "DEMO_INFERENCE", "name": "SONARIS Demo CV Pipeline", "version": "1.0" },
  "images": {
    "original": "/files/SONARIS-1A2B3C4D/original.png",
    "denoised": "/files/SONARIS-1A2B3C4D/denoised.png",
    "enhanced": "/files/SONARIS-1A2B3C4D/enhanced.png",
    "normalized": "/files/SONARIS-1A2B3C4D/normalized.png",
    "annotated": "/files/SONARIS-1A2B3C4D/annotated.png"
  },
  "detections": [
    {
      "id": 1,
      "mission_id": "SONARIS-1A2B3C4D",
      "object_class": "Unknown Anomaly",
      "confidence": 0.57,
      "risk": "LOW",
      "bbox": { "x": 100, "y": 120, "width": 200, "height": 150 },
      "latitude": null,
      "longitude": null,
      "location_source": "UNAVAILABLE",
      "verification_status": "REQUIRES_EXPERT_REVIEW",
      "analysis_mode": "DEMO_INFERENCE",
      "timestamp": "2026-09-11T10:00:00Z"
    }
  ],
  "disclaimers": {
    "risk": "Risk score is an operational prioritization aid and is not a certified maritime safety assessment.",
    "confidence": "Confidence represents model confidence and does not prove object identity."
  }
}
```

Prepend your API base URL (e.g. `http://localhost:8001`) to every path under
`images` to load them directly as `<img src>`.

### GET /detections?search=&risk=&verification_status=&mission_id=
Returns an array of detection objects (same shape as above, without the wrapper).

### GET /detections/{id}
Returns a single detection object, or `404` with `NOT_FOUND`.

### GET /missions
```json
[
  {
    "mission_id": "SONARIS-1A2B3C4D",
    "image_name": "sonar.png",
    "timestamp": "2026-09-11T10:00:00Z",
    "analysis_mode": "DEMO_INFERENCE",
    "detection_count": 3,
    "high_risk_count": 1,
    "verification_summary": { "AI_DETECTED": 2, "REQUIRES_EXPERT_REVIEW": 1 }
  }
]
```

### GET /missions/{mission_id}
Same as above plus `processing_time_ms`, `location_source`, and full `detections[]`.

### POST /verify
```json
{ "detection_id": 1, "decision": "CONFIRM", "notes": "Operator confirmed target" }
```
`decision` is one of `CONFIRM | REJECT | REVIEW`, mapped internally to
`VERIFIED_BY_OPERATOR | REJECTED | REQUIRES_EXPERT_REVIEW`.

**Response:**
```json
{
  "detection_id": 1,
  "verification_status": "VERIFIED_BY_OPERATOR",
  "decision": "CONFIRM",
  "notes": "Operator confirmed target",
  "timestamp": "2026-09-11T10:05:00Z"
}
```

### GET /report/{mission_id}
Returns a PDF file (`application/pdf`).

### GET /report/{mission_id}/csv
Returns a CSV file. Columns: `mission_id, image_name, object_class, confidence, risk, latitude, longitude, timestamp, verification_status, analysis_mode`.

### GET /report/{mission_id}/json
Returns the full mission + detections as structured JSON (same shape as `GET /missions/{id}`).

### GET /dashboard/stats
```json
{
  "total_images_analyzed": 4,
  "total_objects_detected": 11,
  "high_risk_objects": 2,
  "verified_detections": 3,
  "pending_reviews": 2,
  "average_processing_time_ms": 943.5,
  "is_demo_data": false
}
```
All values are computed live from the database — zero, not fake, when empty.

### Static files
`GET /files/{mission_id}/{stage}.png` where stage is one of
`original|denoised|enhanced|normalized|annotated`.

---

## 7. AI_INFERENCE vs. DEMO_INFERENCE — exact distinction

| | `AI_INFERENCE` | `DEMO_INFERENCE` |
|---|---|---|
| Triggered when | A valid trained YOLO model loads successfully from `MODEL_PATH` | No model file present, `ultralytics` not installed, or the model fails to load |
| What runs | `ai/yolo_detector.py` — real trained-model inference | `ai/demo_detector.py` — deterministic OpenCV blob/contour heuristic (adaptive threshold + morphology + contour geometry) |
| Confidence meaning | Learned model confidence | A transparent heuristic score derived from contour solidity and local contrast — **not** a trained probability |
| Object class | From the model's own class list, mapped to SONARIS's taxonomy (`Unknown Anomaly` if unrecognized) | From conservative deterministic shape rules (aspect ratio, size, solidity); defaults to `Unknown Anomaly` when no rule confidently applies |
| Never claims | — | To be a trained AI model or to prove object identity |

Every API response and every generated PDF report states `analysis_mode`
explicitly so the frontend and any human reviewer always know which pipeline
produced a given result. If a trained model fails mid-request, the backend
logs the reason internally, degrades to `DEMO_INFERENCE` for that request,
and does **not** crash.

---

## 8. Known limitations

- `DEMO_INFERENCE` is a heuristic CV pipeline, not a trained classifier — it
  is meant to demonstrate the full pipeline end-to-end, not for judging
  detection accuracy.
- No authentication/authorization layer is included (out of scope for this
  prototype — add an auth dependency before any real deployment).
- `MODEL_PATH` is checked once per process; restart the server after adding
  a new trained model file.
- GPS extraction only reads standard EXIF GPS tags; sonar imagery without
  embedded EXIF (common for raw sonar exports) will report
  `location_source: "UNAVAILABLE"` unless `demo_geolocation=true` is passed.
- SQLite is used for simplicity; swap `DATABASE_URL` for Postgres/MySQL in
  production via any SQLAlchemy-compatible connection string.
