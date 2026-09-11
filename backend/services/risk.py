"""
SONARIS Risk Assessment Service

A transparent, rule-based prioritization system. This is NOT a certified
maritime safety assessment -- see config.RISK_DISCLAIMER, which must
accompany any risk value surfaced to the user.
"""
from config import HAZARDOUS_CLASSES

HIGH_CONF = 0.70
MEDIUM_CONF = 0.40


def calculate_risk(object_class: str, confidence: float, verification_status: str) -> str:
    """
    Rules (evaluated in order):

    HIGH:
      - verification_status == "VERIFIED_BY_OPERATOR" and object_class is hazardous
      - or object_class is hazardous and confidence >= HIGH_CONF

    MEDIUM:
      - object_class is hazardous and confidence >= MEDIUM_CONF (but < HIGH_CONF)
      - or object_class is non-hazardous but confidence >= HIGH_CONF (worth a look)

    LOW:
      - everything else (low-confidence anomalies, natural seabed features)
    """
    is_hazardous = object_class in HAZARDOUS_CLASSES

    if verification_status == "VERIFIED_BY_OPERATOR" and is_hazardous:
        return "HIGH"

    if is_hazardous and confidence >= HIGH_CONF:
        return "HIGH"

    if is_hazardous and confidence >= MEDIUM_CONF:
        return "MEDIUM"

    if not is_hazardous and confidence >= HIGH_CONF and object_class != "Natural Seabed Feature":
        return "MEDIUM"

    return "LOW"
