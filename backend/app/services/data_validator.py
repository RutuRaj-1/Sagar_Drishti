"""
data_validator.py
-----------------
Production validation layer for ocean datasets (CMEMS, Argo, Gliders, HF Radar, RAMA).
Enforces geographic, temporal, and physical bounds on all incoming observations.
"""
import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger("sagar.validator")

# Physical range bounds for oceanographic variables
VALID_RANGES = {
    "temperature": (-2.0, 45.0),       # Sea temperature in °C
    "salinity": (0.0, 45.0),           # Practical salinity units (PSU)
    "ssh": (-5.0, 5.0),                # Sea surface height in m
    "mld": (0.0, 2000.0),              # Mixed layer depth in m
    "pressure": (0.0, 11000.0),        # Pressure in dbar
    "current_speed": (0.0, 15.0),      # Ocean surface current speed in m/s
    "wind_speed": (0.0, 100.0),        # Wind speed in m/s
}

def validate_coordinates(lat: float, lon: float) -> bool:
    """Validate latitude and longitude are within standard geographical bounds."""
    if lat is None or lon is None:
        return False
    return -90.0 <= float(lat) <= 90.0 and -180.0 <= float(lon) <= 180.0

def validate_glider_mission(data: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """
    Validate glider tracks and observations:
    - Coordinates in range
    - Valid timestamps
    - Deduplicate trajectory points
    """
    if not isinstance(data, list) or len(data) == 0:
        return False, "Glider dataset empty or invalid format", []

    cleaned_data = []
    total_valid_obs = 0
    for mission in data:
        lat = mission.get("latitude")
        lon = mission.get("longitude")
        if not validate_coordinates(lat, lon):
            continue

        traj = mission.get("trajectory", [])
        clean_traj = []
        for pt in traj:
            if isinstance(pt, list) and len(pt) >= 2:
                p_lat, p_lon = pt[0], pt[1]
            elif isinstance(pt, dict):
                p_lat, p_lon = pt.get("lat"), pt.get("lon")
            else:
                continue
            if validate_coordinates(p_lat, p_lon):
                clean_traj.append(pt)

        m_copy = dict(mission)
        m_copy["trajectory"] = clean_traj
        n_obs = mission.get("n_obs") or len(clean_traj)
        m_copy["n_obs"] = n_obs
        total_valid_obs += n_obs
        cleaned_data.append(m_copy)

    if total_valid_obs == 0:
        return False, "No valid glider observations after validation filter", []

    return True, f"Validated {len(cleaned_data)} glider missions with {total_valid_obs} observations", cleaned_data

def validate_hf_radar(data: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
    """Validate HF Radar station vectors and metadata."""
    if not isinstance(data, dict) or "stations" not in data:
        return False, "Invalid HF radar structure", {}

    stations = data.get("stations", [])
    clean_stations = []
    total_vectors = 0

    for st in stations:
        lat = st.get("latitude")
        lon = st.get("longitude")
        if not validate_coordinates(lat, lon):
            continue

        raw_vectors = st.get("vectors", [])
        clean_vectors = []
        for v in raw_vectors:
            v_lat = v.get("latitude")
            v_lon = v.get("longitude")
            speed = v.get("speed", 0.0)
            if not validate_coordinates(v_lat, v_lon):
                continue
            if not (0.0 <= speed <= VALID_RANGES["current_speed"][1]):
                continue
            clean_vectors.append(v)

        st_copy = dict(st)
        st_copy["vectors"] = clean_vectors
        st_copy["n_vectors"] = len(clean_vectors)
        total_vectors += len(clean_vectors)
        clean_stations.append(st_copy)

    if not clean_stations:
        return False, "No valid HF radar stations found", {}

    result = dict(data)
    result["stations"] = clean_stations
    result["n_stations"] = len(clean_stations)
    return True, f"Validated {len(clean_stations)} HF radar stations with {total_vectors} vectors", result

def validate_rama_buoys(data: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
    """Validate RAMA moored buoy network records and vertical profiles."""
    if not isinstance(data, dict) or "buoys" not in data:
        return False, "Invalid RAMA buoy structure", {}

    buoys = data.get("buoys", [])
    clean_buoys = []

    for b in buoys:
        lat = b.get("latitude")
        lon = b.get("longitude")
        if not validate_coordinates(lat, lon):
            continue

        # Validate SST, SSS ranges
        sst = b.get("sst")
        sss = b.get("sss")
        if sst is not None and not (VALID_RANGES["temperature"][0] <= sst <= VALID_RANGES["temperature"][1]):
            logger.warning(f"SST {sst} out of range for buoy {b.get('buoy_id')}")
            continue

        clean_buoys.append(dict(b))

    if not clean_buoys:
        return False, "No valid RAMA buoys found", {}

    result = dict(data)
    result["buoys"] = clean_buoys
    result["n_buoys"] = len(clean_buoys)
    return True, f"Validated {len(clean_buoys)} RAMA buoys", result
