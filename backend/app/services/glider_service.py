"""
glider_service.py
-----------------
Service to parse and serve Underwater Ocean Glider missions and dive profiles.
Underwater gliders provide high vertical-resolution saw-tooth profiles along
designated oceanic transects.
"""
import json
import os
import functools
from typing import List, Optional, Dict, Any

from app import config

@functools.lru_cache(maxsize=1)
def _load_gliders() -> List[Dict[str, Any]]:
    if not os.path.exists(config.GLIDER_JSON_PATH):
        return []
    with open(config.GLIDER_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def list_gliders() -> List[Dict[str, Any]]:
    """Return summary of all active glider missions."""
    gliders = _load_gliders()
    summaries = []
    for g in gliders:
        summaries.append({
            "instrument_id": g.get("instrument_id"),
            "type": "glider",
            "latitude": g.get("latitude"),
            "longitude": g.get("longitude"),
            "timestamp": g.get("timestamp"),
            "status": g.get("status", "active"),
            "max_depth": max(g.get("depth_levels", [0])),
            "available_params": [k for k in ["temperature", "salinity", "chlorophyll"] if k in g],
        })
    return summaries


def get_glider_profile(instrument_id: str) -> Optional[Dict[str, Any]]:
    """Return full vertical dive profile for a glider."""
    gliders = _load_gliders()
    glider = next((g for g in gliders if g["instrument_id"] == instrument_id), None)
    if not glider:
        return None

    depths = glider.get("depth_levels", [])
    profiles = {}
    for param in ["temperature", "salinity", "chlorophyll"]:
        if param in glider:
            profiles[param] = {
                "pressure": depths,
                "values": glider[param],
                "n_levels": len(depths),
            }

    return {
        "instrument_id": glider["instrument_id"],
        "type": "glider",
        "latitude": glider["latitude"],
        "longitude": glider["longitude"],
        "timestamp": glider["timestamp"],
        "depth_profiles": profiles,
        "available_params": list(profiles.keys()),
    }
