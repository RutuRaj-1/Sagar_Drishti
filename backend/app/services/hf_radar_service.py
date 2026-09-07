"""
hf_radar_service.py
-------------------
Service layer for INCOIS Coastal High-Frequency (HF) Radar surface current network.
Provides coastal station metadata and radial/total surface velocity vector grids.
"""
import json
import os
import functools
from typing import List, Optional, Dict, Any

from app import config


def _load_hf_radar_data() -> Dict[str, Any]:
    """Load the HF Radar surface current dataset dynamically from disk."""
    if not os.path.exists(config.HF_RADAR_JSON_PATH):
        return {"stations": []}
    try:
        with open(config.HF_RADAR_JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"stations": []}


def list_stations() -> List[Dict[str, Any]]:
    """Return summary list of all active coastal HF Radar stations."""
    data = _load_hf_radar_data()
    stations = data.get("stations", [])
    summaries = []
    for st in stations:
        summaries.append({
            "station_id": st.get("station_id"),
            "name": st.get("name"),
            "state": st.get("state"),
            "coast": st.get("coast"),
            "latitude": st.get("latitude"),
            "longitude": st.get("longitude"),
            "frequency_mhz": st.get("frequency_mhz"),
            "range_km": st.get("range_km"),
            "operator": st.get("operator", "INCOIS / NIOT"),
            "status": st.get("status", "active"),
            "n_vectors": st.get("n_vectors", 0),
            "avg_speed": st.get("avg_speed", 0.0),
            "max_speed": st.get("max_speed", 0.0),
            "last_updated": st.get("last_updated"),
        })
    return summaries


def get_station_vectors(station_id: str) -> Optional[Dict[str, Any]]:
    """Return full surface current vector field surrounding a specific HF Radar station."""
    data = _load_hf_radar_data()
    stations = data.get("stations", [])
    st = next((s for s in stations if s.get("station_id") == station_id), None)
    if not st:
        return None
    return st


def get_all_coastal_vectors() -> List[Dict[str, Any]]:
    """Return combined coastal surface velocity vector fields across all active HF Radar stations."""
    data = _load_hf_radar_data()
    all_vectors = []
    for st in data.get("stations", []):
        st_id = st.get("station_id")
        st_name = st.get("name")
        for vec in st.get("vectors", []):
            vec_copy = dict(vec)
            vec_copy["station_id"] = st_id
            vec_copy["station_name"] = st_name
            all_vectors.append(vec_copy)
    return all_vectors
