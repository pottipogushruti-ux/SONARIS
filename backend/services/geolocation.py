"""
SONARIS Geolocation Service

Inspects image EXIF metadata for real GPS coordinates. Never invents
coordinates. If no metadata is present, location_source="UNAVAILABLE" and
latitude/longitude are null, UNLESS the caller explicitly requests demo mode,
in which case a clearly-labelled simulated coordinate is generated
deterministically (not randomly) from the mission_id so demo runs are
reproducible -- and location_source is set to "SIMULATED" so the frontend
can never confuse it with a real reading.
"""
import hashlib
from typing import Optional, Tuple

from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS


def _convert_to_degrees(value) -> float:
    d, m, s = value
    d = float(d)
    m = float(m)
    s = float(s)
    return d + (m / 60.0) + (s / 3600.0)


def extract_gps(image_path: str) -> Tuple[Optional[float], Optional[float], str]:
    """
    Attempts to read real GPS EXIF data from the image.
    Returns (latitude, longitude, location_source).
    location_source is "IMAGE_METADATA" on success, "UNAVAILABLE" otherwise.
    """
    try:
        img = Image.open(image_path)
        exif_data = img._getexif()  # noqa: SLF001 - standard way to access raw EXIF via Pillow
        if not exif_data:
            return None, None, "UNAVAILABLE"

        gps_info = {}
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == "GPSInfo":
                for gps_tag_id, gps_value in value.items():
                    gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_info[gps_tag] = gps_value

        if not gps_info or "GPSLatitude" not in gps_info or "GPSLongitude" not in gps_info:
            return None, None, "UNAVAILABLE"

        lat = _convert_to_degrees(gps_info["GPSLatitude"])
        if gps_info.get("GPSLatitudeRef", "N") in ("S", "s"):
            lat = -lat

        lon = _convert_to_degrees(gps_info["GPSLongitude"])
        if gps_info.get("GPSLongitudeRef", "E") in ("W", "w"):
            lon = -lon

        return round(lat, 6), round(lon, 6), "IMAGE_METADATA"

    except Exception:
        # Any parsing failure is treated as "no metadata" -- never guess.
        return None, None, "UNAVAILABLE"


def simulate_location(mission_id: str) -> Tuple[float, float, str]:
    """
    Deterministically derives a plausible-looking demo coordinate from the
    mission_id (NOT random, NOT real). Only to be called when the caller has
    explicitly opted into DEMO MODE simulated geolocation.
    """
    digest = hashlib.sha256(mission_id.encode()).hexdigest()
    lat_seed = int(digest[:8], 16) / 0xFFFFFFFF  # 0..1
    lon_seed = int(digest[8:16], 16) / 0xFFFFFFFF  # 0..1

    # Arbitrary demo bounding box loosely over the Arabian Sea / Indian coast
    # for SIH relevance -- purely illustrative, not a real survey area.
    lat = 8.0 + lat_seed * (23.0 - 8.0)
    lon = 68.0 + lon_seed * (88.0 - 68.0)

    return round(lat, 6), round(lon, 6), "SIMULATED"
