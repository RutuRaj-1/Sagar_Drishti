"""
glider_service.py
-----------------
Service to parse and serve real Autonomous Ocean Glider missions and dive profiles.
Source: IOOS Glider DAC / Rutgers University / OceanGliders GTS
Dataset: ru29-20180812T0220 (Teledyne Webb Slocum G2 Ocean Glider)
Region: Indian Ocean / Bay of Bengal / Sri Lanka Dome (5°N–9°N, 80°E–83°E)
Depth: Surface down to 962.4m depth with 24,611 real in-situ CTD observations.
"""
import json
import os
import functools
from typing import List, Optional, Dict, Any

from app import config


@functools.lru_cache(maxsize=1)
def _load_gliders() -> List[Dict[str, Any]]:
    """Load the real glider mission dataset."""
    if not os.path.exists(config.GLIDER_JSON_PATH):
        return []
    with open(config.GLIDER_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def list_gliders() -> List[Dict[str, Any]]:
    """Return summary of all active real glider missions."""
    gliders = _load_gliders()
    summaries = []
    for g in gliders:
        inst_id = g.get("instrument_id") or g.get("id")
        depths = g.get("depth_levels") or g.get("profile", {}).get("depths", [0])
        max_d = g.get("max_depth") or (max(depths) if depths else 0.0)
        
        summaries.append({
            "instrument_id": inst_id,
            "name": g.get("name", inst_id),
            "model": g.get("model", "Teledyne Webb Slocum G2 Glider"),
            "institution": g.get("institution", "IOOS / Rutgers / INCOIS Partnership"),
            "data_source": g.get("data_source", "IOOS Glider DAC ERDDAP"),
            "description": g.get("description", ""),
            "type": "glider",
            "latitude": g.get("latitude"),
            "longitude": g.get("longitude"),
            "timestamp": g.get("timestamp"),
            "status": g.get("status", "active"),
            "max_depth": round(float(max_d), 1),
            "n_obs": g.get("n_obs", len(g.get("trajectory", []))),
            "trajectory": g.get("trajectory", []),
            "available_params": g.get("available_params", ["temperature", "salinity"]),
        })
    return summaries


def get_glider_profile(instrument_id: str) -> Optional[Dict[str, Any]]:
    """Return full vertical CTD dive profile for an official real ocean glider."""
    gliders = _load_gliders()
    glider = next(
        (g for g in gliders if (g.get("instrument_id") == instrument_id or g.get("id") == instrument_id)),
        None,
    )
    if not glider:
        return None

    depths = glider.get("depth_levels") or glider.get("profile", {}).get("depths", [])
    profiles = {}
    
    # Check for direct or nested temperature and salinity
    temps = glider.get("temperature") or glider.get("profile", {}).get("temperature", [])
    sals = glider.get("salinity") or glider.get("profile", {}).get("salinity", [])

    if temps:
        profiles["temperature"] = {
            "pressure": depths,
            "values": temps,
            "n_levels": len(depths),
        }
    if sals:
        profiles["salinity"] = {
            "pressure": depths,
            "values": sals,
            "n_levels": len(depths),
        }

    return {
        "instrument_id": glider.get("instrument_id") or glider.get("id"),
        "name": glider.get("name"),
        "model": glider.get("model", "Teledyne Webb Slocum G2 Glider"),
        "institution": glider.get("institution", "IOOS / Rutgers / INCOIS Partnership"),
        "data_source": glider.get("data_source", "IOOS Glider DAC ERDDAP"),
        "description": glider.get("description", ""),
        "type": "glider",
        "latitude": glider.get("latitude"),
        "longitude": glider.get("longitude"),
        "timestamp": glider.get("timestamp"),
        "depth_profiles": profiles,
        "available_params": list(profiles.keys()),
        "trajectory": glider.get("trajectory", []),
    }
