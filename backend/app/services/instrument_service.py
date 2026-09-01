"""
instrument_service.py
---------------------
Public interface for instrument (Argo float) data.

Now delegates to argo_nc_service.py which reads real NC files from the
Coriolis DataSelection export instead of the old synthetic JSON files.

The CMEMS model comparison uses netcdf_service.get_value_at_point — the
model returns its bottom/surface value at the instrument's lat/lon on the
nearest date, shown as a reference line on the profile chart (SRS §3.6.3).
"""
from typing import List, Optional

from app.services import argo_nc_service
from app.services import netcdf_service


def list_instruments(bbox: Optional[tuple] = None) -> List[dict]:
    """FR-OBS-1: list real Argo float positions (one per platform, most recent profile)."""
    return argo_nc_service.list_floats(bbox)


def get_profile(instrument_id: str, compare_variable: Optional[str] = None) -> Optional[dict]:
    """FR-OBS-2: full depth-profile for one Argo float profile.

    If `compare_variable` is supplied, the CMEMS model value at the float's
    lat/lon on the nearest available date is added as model_comparison —
    this is the key CMEMS × Argo co-location feature (SRS §3.6.3).
    """
    profile = argo_nc_service.get_float_profile(instrument_id)
    if profile is None:
        return None

    if compare_variable:
        date = profile["timestamp"][:10] if profile["timestamp"] else None
        model_val = None
        if date:
            model_val = netcdf_service.get_value_at_point(
                compare_variable, date, profile["latitude"], profile["longitude"]
            )
        profile["model_comparison"] = {
            "variable": compare_variable,
            "model_value": model_val,
            "note": (
                "CMEMS model value at this Argo float position. "
                "Compared against in-situ Argo measurement for validation."
            ),
        }

    return profile
