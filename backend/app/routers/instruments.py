"""
instruments.py  (router)
------------------------
REST endpoints for Argo float in-situ observations.

Endpoints:
  GET /api/instruments                     – list all floats (one marker/platform)
  GET /api/instruments/{id}/profile        – depth profile (all BGC params)
  GET /api/instruments/{id}/trajectory     – GPS track over time
  GET /api/instruments/{id}/tsdiagram      – T-S diagram scatter data
  GET /api/instruments/trajectories/all    – all float tracks (for map overlay)
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from app.services import instrument_service
from app.services import argo_nc_service

router = APIRouter(prefix="/api/instruments", tags=["instruments"])


@router.get("")
def list_instruments(
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
):
    """FR-OBS-1: list Argo float positions, optionally bbox-filtered.
    Returns one marker per platform (most recent profile date).
    Data source: real Argo NC files from Coriolis DataSelection export.
    """
    bbox = None
    if None not in (min_lat, max_lat, min_lon, max_lon):
        bbox = (min_lat, max_lat, min_lon, max_lon)
    return instrument_service.list_instruments(bbox)


@router.get("/trajectories/all")
def get_all_trajectories():
    """Return GPS tracks for all Argo floats.
    Used to draw trajectory lines on the 2D/3D map overlay.
    """
    return argo_nc_service.get_all_trajectories()


@router.get("/{instrument_id}/profile")
def get_profile(
    instrument_id: str,
    compare_variable: Optional[str] = Query(
        None,
        description="If set, also fetches the CMEMS model value at the float's "
                    "lat/lon on the nearest date for model-vs-observation comparison.",
    ),
):
    """FR-OBS-2 / FR-API-4: full depth-vs-variable profile for one Argo profile.
    Returns TEMP, PSAL, and any BGC parameters (DOXY, CHLA, NITRATE, pH, BBP700).
    """
    result = instrument_service.get_profile(instrument_id, compare_variable)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Instrument '{instrument_id}' not found")
    return result


@router.get("/{instrument_id}/trajectory")
def get_trajectory(instrument_id: str):
    """Return the GPS track (lat/lon/date time series) for one float.
    instrument_id format: ARGO-{platform_number}-{index}
    """
    # Extract platform number from instrument_id
    parts = instrument_id.split("-")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid instrument_id format")
    platform_number = parts[1]

    result = argo_nc_service.get_float_trajectory(platform_number)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No trajectory data for platform {platform_number}"
        )
    return result


@router.get("/{instrument_id}/tsdiagram")
def get_ts_diagram(instrument_id: str):
    """Return Temperature–Salinity scatter data for one Argo profile.
    Used to identify water mass signatures in the T-S diagram view.
    """
    result = argo_nc_service.get_ts_diagram(instrument_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"T-S data not available for '{instrument_id}' (requires TEMP + PSAL)"
        )
    return result
