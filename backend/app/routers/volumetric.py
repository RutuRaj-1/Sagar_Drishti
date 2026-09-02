"""
volumetric.py
-------------
REST Router for 4D Volumetric ocean data endpoints:
  - GET /api/volumetric/meta
  - GET /api/volumetric/depth-slice
  - GET /api/volumetric/currents
  - GET /api/volumetric/profile
  - GET /api/volumetric/isosurface
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.services import volumetric_service

router = APIRouter(prefix="/api/volumetric", tags=["volumetric"])


@router.get("/meta")
def get_metadata():
    """Return 4D volumetric metadata, including depth levels, variables, and dates."""
    try:
        return volumetric_service.get_volumetric_metadata()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/depth-slice")
def get_depth_slice(
    variable: str = Query("temperature", description="Variable: temperature, salinity, chlorophyll, u_current, v_current"),
    date: str = Query("2026-08-31", description="Date YYYY-MM-DD"),
    depth: float = Query(0.0, description="Depth level in metres (e.g. 0, 10, 20, 50, 100, 200, 500, 1000)"),
    downsample: int = Query(1, ge=1, le=8, description="Spatial downsample factor"),
):
    """FR-2.3: Return a horizontal slice at a specific depth level."""
    result = volumetric_service.get_depth_slice(variable, date, depth, downsample)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No data for {variable} at date={date}, depth={depth}")
    return result


@router.get("/currents")
def get_current_vectors(
    date: str = Query("2026-08-31", description="Date YYYY-MM-DD"),
    depth: float = Query(0.0, description="Depth level in metres"),
    downsample: int = Query(2, ge=1, le=8, description="Vector grid subsample factor"),
):
    """FR-2.5: Return horizontal current vectors (u, v, speed, angle) at depth."""
    result = volumetric_service.get_current_vectors(date, depth, downsample)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No current vectors for date={date}, depth={depth}")
    return result


@router.get("/profile")
def get_model_profile(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    date: str = Query("2026-08-31", description="Date YYYY-MM-DD"),
    variable: str = Query("temperature", description="Variable name"),
):
    """FR-3.3: Return continuous model depth profile at (lat, lon) for comparison chart."""
    result = volumetric_service.get_model_depth_profile(variable, lat, lon, date)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No model profile at lat={lat}, lon={lon}")
    return result


@router.get("/isosurface")
def get_volume_for_isosurface(
    variable: str = Query("temperature", description="Variable for isosurface extraction"),
    date: str = Query("2026-08-31", description="Date YYYY-MM-DD"),
):
    """FR-2.6: Return 3D scalar voxel grid for Marching Cubes isosurface extraction."""
    result = volumetric_service.get_volume_for_isosurface(variable, date)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No volumetric grid for {variable} on {date}")
    return result
