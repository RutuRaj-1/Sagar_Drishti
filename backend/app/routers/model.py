from fastapi import APIRouter, HTTPException, Query
from app.services import netcdf_service

router = APIRouter(prefix="/api/model", tags=["model"])


@router.get("/surface")
def get_surface(
    variable: str = Query(..., description="Variable name, e.g. tob, sob, zos, mlotst, pbo"),
    date: str = Query(..., description="Date YYYY-MM-DD; nearest available time step is used"),
    downsample: int = Query(4, ge=1, le=16, description="Take every Nth grid point (1=full, 4=default)"),
):
    """FR-API-2: 2D lat×lon surface slice for one Copernicus variable and date.

    This is the primary data endpoint driving both the 2D choropleth map and
    the 3D perspective surface in the SAGAR-DRISHTI frontend.
    Typical payload at downsample=4: ~52×82 = 4,264 float32 values (~17 KB JSON).
    """
    result = netcdf_service.get_surface(variable, date, downsample)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for variable '{variable}' near date '{date}'"
        )
    return result


@router.get("/timeseries")
def get_timeseries(
    variable: str = Query(..., description="Variable name"),
    lat: float = Query(..., description="Latitude (nearest grid point is used)"),
    lon: float = Query(..., description="Longitude (nearest grid point is used)"),
):
    """FR-API-3: full time series (2022-06-01 → 2026-08-31) for one variable
    at the grid point nearest to (lat, lon).

    Used by the click-to-inspect feature: clicking anywhere on the 2D/3D map
    triggers a time-series chart showing ~1553 daily values at that location.
    """
    result = netcdf_service.get_timeseries(variable, lat, lon)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No data for variable '{variable}' at lat={lat}, lon={lon}"
        )
    return result


@router.get("/stats")
def get_stats(
    variable: str = Query(..., description="Variable name"),
    date: str = Query(..., description="Date YYYY-MM-DD"),
):
    """FR-API-4: spatial statistics for one variable/date.
    Returns min, max, mean, std, median, percentiles, and a 20-bin histogram.
    Powers the Statistics Dashboard panel.
    """
    result = netcdf_service.get_stats(variable, date)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No stats for variable '{variable}' on date '{date}'"
        )
    return result


@router.get("/anomaly")
def get_anomaly(
    variable: str = Query(..., description="Variable name"),
    date: str = Query(..., description="Date YYYY-MM-DD"),
    downsample: int = Query(4, ge=1, le=16),
):
    """Return the anomaly field: value(date) − long-term mean.
    Positive = above average, negative = below average.
    Critical for cyclone warm-core detection and eddy identification.
    """
    result = netcdf_service.get_anomaly(variable, date, downsample)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Anomaly calculation failed for '{variable}' on '{date}'"
        )
    return result
