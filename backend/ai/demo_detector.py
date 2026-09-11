"""
SONARIS Demo Detector (DEMO_INFERENCE)

This is NOT a trained AI model. It is a deterministic, rule-based computer
vision pipeline that finds high-contrast blobs against the seabed background
(a common heuristic in classic sonar image processing) and reports them as
"candidate anomalies". It exists so the full SONARIS pipeline can be
demonstrated end-to-end when no trained detection model is available.

Every detection produced here MUST be labelled analysis_mode="DEMO_INFERENCE"
by the caller. This module never claims to be a trained model.
"""
import cv2
import numpy as np

from config import CONFIDENCE_THRESHOLD

MIN_CONTOUR_AREA = 150  # px^2 - ignore speckle-sized noise
MAX_DETECTIONS = 8


def detect_candidates(normalized_image_path):
    """
    Deterministic anomaly-candidate detection on a preprocessed (normalized)
    grayscale sonar image.

    Approach (fully deterministic, no randomness):
      1. Adaptive threshold to isolate high/low intensity blobs vs. background.
      2. Morphological cleanup to remove speckle noise.
      3. Contour extraction -> bounding boxes.
      4. A confidence proxy is derived from contour properties (contrast,
         solidity, size) -- this is a heuristic score, NOT a trained model's
         learned confidence, and is clearly documented as such.
      5. Object class is assigned via simple deterministic shape/size rules
         when a rule confidently applies; otherwise "Unknown Anomaly".

    Returns: list of {"object_class", "confidence", "bbox": (x, y, w, h)}
    """
    img = cv2.imread(normalized_image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return []

    h, w = img.shape[:2]

    # Adaptive threshold highlights local intensity anomalies against the
    # seabed texture better than a single global threshold.
    thresh = cv2.adaptiveThreshold(
        img, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV,
        blockSize=35, C=7,
    )

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    candidates = []
    for c in contours:
        area = cv2.contourArea(c)
        if area < MIN_CONTOUR_AREA:
            continue

        x, y, bw, bh = cv2.boundingRect(c)

        # Ignore boxes that essentially cover the whole frame (likely a global
        # lighting artifact, not a discrete object).
        if bw * bh > 0.6 * (w * h):
            continue

        # --- Heuristic confidence proxy -------------------------------
        # Combines contour solidity (how "blob-like" vs. noisy the shape is)
        # and local contrast between the object region and its surrounding
        # background. This is a transparent, deterministic formula -- not a
        # learned probability.
        hull = cv2.convexHull(c)
        hull_area = cv2.contourArea(hull) or 1.0
        solidity = float(area) / float(hull_area)

        pad = 6
        y0, y1 = max(0, y - pad), min(h, y + bh + pad)
        x0, x1 = max(0, x - pad), min(w, x + bw + pad)
        region = img[y:y + bh, x:x + bw]
        surround = img[y0:y1, x0:x1]

        region_mean = float(np.mean(region)) if region.size else 0.0
        surround_mean = float(np.mean(surround)) if surround.size else 0.0
        contrast = abs(region_mean - surround_mean) / 255.0

        confidence = float(np.clip(0.35 * solidity + 0.65 * contrast + 0.15, 0.0, 0.99))
        confidence = round(confidence, 2)

        if confidence < CONFIDENCE_THRESHOLD:
            continue

        # --- Deterministic, conservative shape-based classification ----
        aspect_ratio = bw / bh if bh else 0
        object_class = _classify_shape(aspect_ratio, area, solidity)

        candidates.append({
            "object_class": object_class,
            "confidence": confidence,
            "bbox": (float(x), float(y), float(bw), float(bh)),
        })

    # Keep the strongest candidates only, sorted by confidence desc.
    candidates.sort(key=lambda d: d["confidence"], reverse=True)
    return candidates[:MAX_DETECTIONS]


def _classify_shape(aspect_ratio, area, solidity):
    """
    Very conservative, deterministic shape heuristic. Since this is not a
    trained classifier, it defaults to "Unknown Anomaly" unless a shape
    pattern is a strong, explainable match -- avoiding false specificity.
    """
    if solidity < 0.55:
        # Irregular, scattered shape -> could be a ghost net / debris tangle.
        return "Marine Debris"
    if aspect_ratio > 3.5 or aspect_ratio < 0.28:
        # Long, thin, elongated object.
        return "Submarine Pipeline"
    if 0.8 <= aspect_ratio <= 1.25 and area < 2000:
        # Small, roughly circular/cylindrical blob.
        return "Mine/Cylinder-like Object"
    return "Unknown Anomaly"
