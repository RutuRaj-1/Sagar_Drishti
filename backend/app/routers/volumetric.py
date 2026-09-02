"""
volumetric.py
-------------
REST Router for 4D Volumetric ocean data endpoints backed by the REAL CMEMS dataset.

Source: Copernicus Marine MOI GLO12 — GLOBAL_ANALYSISFORECAST_PHY_001_024
        real_ocean_model_4d.nc (thetao, so, uo, vo — 34 depth levels, 7 days)

Endpoints:
  - GET /api/volumetric/meta          → metadata (depth levels, variables, spatial extent)
  - GET /api/volumetric/depth-slice   → 2D horizontal slice at depth for a variable
  - GET /api/volumetric/currents      → u/v vector field at depth (real uo/vo)
  - GET /api/volumetric/profile       → full 34-level depth profile at (lat, lon)
  - GET /api/volumetric/isosurface    → 3D voxel grid for Marching Cubes
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.services import volumetric_service

router = APIRouter(prefix="/api/volumetric", tags=["volumetric"])


@router.get("/meta")
def get_metadata():
    """
    Return metadata about the real 4D CMEMS dataset:
    34 depth levels, 4 variables (temperature, salinity, u_current, v_current),
    spatial extent (5–22°N, 68–95°E), and available dates.
    """
    try:
        return volumetric_service.get_volumetric_metadata()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/depth-slice")
def get_depth_slice(
    variable: str = Query(
        "temperature",
        description="Friendly variable name: temperature | salinity | u_current | v_current",
    ),
    date: Optional[str] = Query(
        None,
        description="Date YYYY-MM-DD. Omit to use the latest available time step.",
    ),
    depth: float = Query(
        0.0,
        description=(
            "Target depth in metres — snapped to nearest real CMEMS level. "
            "Available: 1.5, 6.1, 13.5, 25.2, 40.6, 57.5, 77.9, 101.6, 127.9, "
            "157.0, 189.0, 222.5, 256.5, 291.0, 323.2, 351.7, 375.1, 393.3, "
            "407.2, 417.5, 425.0, 430.6, 434.4, 437.2, 439.2, 440.8, 442.0, "
            "443.0, 443.8, 444.5, 445.0, 502.8, 699.3, 902.3 m"
        ),
    ),
    downsample: int = Query(
        2, ge=1, le=8,
        description="Spatial downsample factor (2 = every 2nd grid point). Use higher for faster response.",
    ),
):
    """
    FR-2.3: Return a 2D horizontal slice of a real CMEMS variable
    at the nearest available depth level and date.
    
    Real CMEMS variable mapping: temperature→thetao, salinity→so,
    u_current→uo, v_current→vo.
    """
    result = volumetric_service.get_depth_slice(variable, date, depth, downsample)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No data for variable='{variable}' at date={date}, depth={depth}m. "
                   "Valid variables: temperature, salinity, u_current, v_current.",
        )
    return result


@router.get("/currents")
def get_current_vectors(
    date: Optional[str] = Query(
        None,
        description="Date YYYY-MM-DD. Omit to use the latest available time step.",
    ),
    depth: float = Query(
        0.0,
        description="Depth level in metres (snapped to nearest real CMEMS depth level).",
    ),
    downsample: int = Query(
        3, ge=1, le=8,
        description="Vector grid subsample factor. Default 3 = every 3rd grid point.",
    ),
):
    """
    FR-2.5: Return real CMEMS horizontal current vectors (uo/vo → u, v, speed, angle)
    at the specified depth. Each point includes speed in m/s and direction in degrees.
    """
    result = volumetric_service.get_current_vectors(date, depth, downsample)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No current vectors (uo/vo) found for date={date}, depth={depth}m.",
        )
    return result


@router.get("/profile")
def get_model_profile(
    lat: float = Query(..., description="Latitude (5.0–22.0°N for Indian Ocean domain)"),
    lon: float = Query(..., description="Longitude (68.0–95.0°E for Indian Ocean domain)"),
    date: Optional[str] = Query(
        None,
        description="Date YYYY-MM-DD. Omit to use the latest available time step.",
    ),
    variable: str = Query(
        "temperature",
        description="Variable: temperature | salinity",
    ),
):
    """
    FR-3.3: Return a full 34-level vertical depth profile from the real CMEMS 4D dataset
    at the nearest grid point to (lat, lon).
    Used for model-vs-Argo dual-line comparison chart.
    """
    result = volumetric_service.get_model_depth_profile(variable, lat, lon, date)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No real CMEMS profile at lat={lat}, lon={lon}. "
                   f"Domain: 5–22°N, 68–95°E.",
        )
    return result


@router.get("/isosurface")
def get_volume_for_isosurface(
    variable: str = Query(
        "temperature",
        description="Variable for 3D isosurface: temperature | salinity",
    ),
    date: Optional[str] = Query(
        None,
        description="Date YYYY-MM-DD. Omit to use the latest available time step.",
    ),
    max_depth: float = Query(
        500.0,
        description="Maximum depth (metres) to include in 3D volume. Default 500m.",
    ),
):
    """
    FR-2.6: Return the real CMEMS 3D scalar voxel grid for client-side
    Marching Cubes isosurface extraction in Three.js WebGL.
    Depth range restricted to 0–max_depth for manageable payload.
    """
    result = volumetric_service.get_volume_for_isosurface(
        variable, date, depth_range=(0.0, max_depth)
    )
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No volumetric grid available for variable='{variable}'.",
        )
    return result
