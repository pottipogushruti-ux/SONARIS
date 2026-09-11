"""
SONARIS YOLO Detector

Runs real inference using a trained Ultralytics YOLO model. Only invoked when
ai.model_loader.get_model() confirms a valid model is loaded.
"""
import logging

from config import DETECTION_CLASSES

logger = logging.getLogger("sonaris.ai.yolo_detector")


def run_inference(model, image_path):
    """
    Runs the trained model on image_path.

    Returns a list of raw detections:
        [{"object_class": str, "confidence": float, "bbox": (x, y, w, h)}, ...]

    Class names come from the model itself where possible; if a predicted class
    isn't part of SONARIS's supported taxonomy, it is mapped to "Unknown Anomaly"
    rather than forcing an unsupported label.
    """
    results = model.predict(source=image_path, verbose=False)
    detections = []

    for result in results:
        boxes = getattr(result, "boxes", None)
        if boxes is None:
            continue
        names = result.names if hasattr(result, "names") else {}

        for box in boxes:
            cls_id = int(box.cls[0]) if hasattr(box, "cls") else None
            raw_name = names.get(cls_id, "Unknown Anomaly") if names else "Unknown Anomaly"
            object_class = raw_name if raw_name in DETECTION_CLASSES else "Unknown Anomaly"

            conf = float(box.conf[0]) if hasattr(box, "conf") else 0.0

            xyxy = box.xyxy[0].tolist() if hasattr(box, "xyxy") else [0, 0, 0, 0]
            x1, y1, x2, y2 = xyxy
            bbox = (float(x1), float(y1), float(x2 - x1), float(y2 - y1))

            detections.append({
                "object_class": object_class,
                "confidence": round(conf, 4),
                "bbox": bbox,
            })

    return detections
