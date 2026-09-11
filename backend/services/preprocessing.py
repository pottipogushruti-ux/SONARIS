"""
SONARIS Preprocessing Service

Pipeline: Original -> Denoising -> Contrast Enhancement -> Normalization

Each stage is saved separately so the frontend can display the full pipeline.
The original file is never modified in place.
"""
import os

import cv2
import numpy as np

from config import PROCESSED_DIR


def preprocess_image(image_path: str, mission_id: str) -> dict:
    """
    Runs the full preprocessing pipeline on image_path and saves each stage
    under processed/{mission_id}/. Returns a dict of stage -> absolute path.
    """
    out_dir = os.path.join(PROCESSED_DIR, mission_id)
    os.makedirs(out_dir, exist_ok=True)

    original = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if original is None:
        raise ValueError("Image could not be decoded by OpenCV.")

    original_path = os.path.join(out_dir, "original.png")
    cv2.imwrite(original_path, original)

    # 1. Grayscale conversion (sonar imagery is typically single-channel)
    gray = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY)

    # 2. Denoising - fastNlMeansDenoising suits speckle-heavy sonar imagery
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
    denoised_path = os.path.join(out_dir, "denoised.png")
    cv2.imwrite(denoised_path, denoised)

    # 3. Contrast enhancement via CLAHE (adaptive histogram equalization)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    enhanced_path = os.path.join(out_dir, "enhanced.png")
    cv2.imwrite(enhanced_path, enhanced)

    # 4. Normalization - scale intensities to full 0-255 range
    normalized = cv2.normalize(enhanced, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    normalized_path = os.path.join(out_dir, "normalized.png")
    cv2.imwrite(normalized_path, normalized)

    return {
        "original": original_path,
        "denoised": denoised_path,
        "enhanced": enhanced_path,
        "normalized": normalized_path,
    }
