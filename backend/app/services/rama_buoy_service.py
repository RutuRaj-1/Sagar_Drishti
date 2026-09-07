"""
rama_buoy_service.py
--------------------
Service layer for RAMA Moored Buoy Array (Research Moored Array for
African-Asian-Australian Monsoon Analysis and Prediction).
Data Source: INCOIS / NOAA PMEL Joint RAMA Mooring Array.
"""
import json
import os
import functools
from typing import List, Optional, Dict, Any

from app import config
from app.services import netcdf_service


def _load_rama_data() -> Dict[str, Any]:
    """Load the RAMA Moored Buoy dataset, dynamically merging per-buoy files."""
    data = {"buoys": []}
    if os.path.exists(config.RAMA_BUOY_JSON_PATH):
        try:
            with open(config.RAMA_BUOY_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            pass

    buoys_map = {b.get("buoy_id"): b for b in data.get("buoys", []) if b.get("buoy_id")}

    buoys_dir = os.path.join(config.DATA_DIR, "rama", "buoys")
    if os.path.isdir(buoys_dir):
        for fname in os.listdir(buoys_dir):
            if fname.endswith(".json") and not fname.endswith("_2026-09-07.json"):
                try:
                    fpath = os.path.join(buoys_dir, fname)
                    with open(fpath, "r", encoding="utf-8") as bf:
                        buoy_obj = json.load(bf)
                        bid = buoy_obj.get("buoy_id") or buoy_obj.get("name")
                        if bid and bid not in buoys_map:
                            buoys_map[bid] = buoy_obj
                except Exception:
                    pass

    return {"buoys": list(buoys_map.values())}


def list_buoys() -> List[Dict[str, Any]]:
    """Return summary list of all RAMA Moored Buoys."""
    data = _load_rama_data()
    buoys = data.get("buoys", [])
    summaries = []
    for b in buoys:
        summaries.append({
            "buoy_id": b.get("buoy_id"),
            "name": b.get("name"),
            "region": b.get("region"),
            "latitude": b.get("latitude"),
            "longitude": b.get("longitude"),
            "mooring_depth_m": b.get("mooring_depth_m"),
            "institution": b.get("institution", "INCOIS / NOAA PMEL"),
            "deployed_date": b.get("deployed_date"),
            "status": b.get("status", "active"),
            "sst": b.get("sst"),
            "sss": b.get("sss"),
            "air_temp": b.get("air_temp"),
            "wind_speed_ms": b.get("wind_speed_ms"),
            "wind_direction_deg": b.get("wind_direction_deg"),
            "barometric_pressure_hpa": b.get("barometric_pressure_hpa"),
            "last_observation_time": b.get("last_observation_time"),
            "mld_m": b.get("mld_m"),
            "thermocline_depth_m": b.get("thermocline_depth_m"),
        })
    return summaries


def get_buoy_profile(buoy_id: str, compare_variable: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Return vertical thermistor profile (T & S vs depth) for a RAMA Moored Buoy."""
    data = _load_rama_data()
    buoy = next((b for b in data.get("buoys", []) if b.get("buoy_id") == buoy_id), None)
    if not buoy:
        return None
        
    depth_profiles = buoy.get("depth_profiles", {})
    depths = depth_profiles.get("depths", [])
    temps = depth_profiles.get("temperature", [])
    sals = depth_profiles.get("salinity", [])
    
    profiles = {}
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

    res = {
        "buoy_id": buoy.get("buoy_id"),
        "name": buoy.get("name"),
        "type": "buoy",
        "institution": buoy.get("institution"),
        "latitude": buoy.get("latitude"),
        "longitude": buoy.get("longitude"),
        "timestamp": buoy.get("last_observation_time"),
        "sst": buoy.get("sst"),
        "sss": buoy.get("sss"),
        "air_temp": buoy.get("air_temp"),
        "wind_speed_ms": buoy.get("wind_speed_ms"),
        "barometric_pressure_hpa": buoy.get("barometric_pressure_hpa"),
        "depth_profiles": profiles,
        "available_params": list(profiles.keys()),
    }
    
    if compare_variable:
        date = buoy.get("last_observation_time")[:10] if buoy.get("last_observation_time") else "2026-08-31"
        model_val = netcdf_service.get_value_at_point(
            compare_variable, date, buoy["latitude"], buoy["longitude"]
        )
        res["model_comparison"] = {
            "variable": compare_variable,
            "model_value": model_val,
            "note": "CMEMS model value co-located at RAMA Buoy position.",
        }

    return res
