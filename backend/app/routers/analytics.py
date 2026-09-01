"""
analytics.py
------------
Analytics router implementing trend analysis and correlation endpoints
for the SAGAR-DRISHTI platform. These power the Analytics Dashboard tab
in the frontend with meaningful ocean science insights.

SRS §3.6.3 — Model-vs-Observation Co-Location
PRD §2.3  — Scientist / Researcher user stories
"""
from typing import Optional
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from app.services import netcdf_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/trend")
def get_trend(
    variable: str = Query(..., description="Variable name, e.g. tob"),
    lat: float = Query(..., description="Latitude of point"),
    lon: float = Query(..., description="Longitude of point"),
    window: int = Query(30, ge=7, le=365, description="Rolling window size (days) for smoothing"),
):
    """Return the time series at (lat, lon) with:
    - raw values
    - rolling mean (window-day smooth)
    - linear trend line (slope per year, intercept)

    Used in the Analytics Dashboard to show whether a location is warming/
    cooling, freshening/salinifying, etc. over the 2022–2026 period.
    """
    ts = netcdf_service.get_timeseries(variable, lat, lon)
    if ts is None:
        raise HTTPException(status_code=404, detail="No data")

    values = np.array([v if v is not None else np.nan for v in ts["values"]])
    n = len(values)
    valid_mask = ~np.isnan(values)

    # Rolling mean
    rolling = []
    half = window // 2
    for i in range(n):
        lo = max(0, i - half)
        hi = min(n, i + half + 1)
        seg = values[lo:hi]
        valid_seg = seg[~np.isnan(seg)]
        rolling.append(round(float(np.mean(valid_seg)), 4) if len(valid_seg) > 0 else None)

    # Linear regression (days since start as x)
    x = np.arange(n, dtype=np.float64)
    valid_x = x[valid_mask]
    valid_y = values[valid_mask]
    slope = intercept = None
    trend_line = [None] * n
    if len(valid_x) > 2:
        coeffs = np.polyfit(valid_x, valid_y, 1)
        slope = float(coeffs[0])  # units per day
        intercept = float(coeffs[1])
        slope_per_year = slope * 365.25
        trend_line = [round(float(slope * xi + intercept), 4) for xi in x]
    else:
        slope_per_year = None

    return {
        **ts,
        "rolling_mean": rolling,
        "trend_line": trend_line,
        "slope_per_day": slope,
        "slope_per_year": slope_per_year,
        "trend_unit": ts["unit"] + "/year",
    }


@router.get("/correlation")
def get_correlation(
    var1: str = Query(..., description="First variable, e.g. tob"),
    var2: str = Query(..., description="Second variable, e.g. mlotst"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Compute the Pearson correlation between two variables at (lat, lon)
    across all time steps. Also returns the paired scatter plot data.
    """
    ts1 = netcdf_service.get_timeseries(var1, lat, lon)
    ts2 = netcdf_service.get_timeseries(var2, lat, lon)
    if ts1 is None or ts2 is None:
        raise HTTPException(status_code=404, detail="Data not available for one or both variables")

    v1 = np.array([v if v is not None else np.nan for v in ts1["values"]])
    v2 = np.array([v if v is not None else np.nan for v in ts2["values"]])
    dates = ts1["dates"]

    # Align by removing rows where either is NaN
    mask = ~(np.isnan(v1) | np.isnan(v2))
    v1c = v1[mask]
    v2c = v2[mask]
    dates_clean = [d for d, m in zip(dates, mask) if m]

    r = float(np.corrcoef(v1c, v2c)[0, 1]) if len(v1c) > 2 else 0.0

    # Subsample scatter data to 200 points max for JSON efficiency
    step = max(1, len(v1c) // 200)
    scatter = [
        {"x": round(float(v1c[i]), 4), "y": round(float(v2c[i]), 4), "date": dates_clean[i]}
        for i in range(0, len(v1c), step)
    ]

    return {
        "var1": var1,
        "var2": var2,
        "var1_name": ts1["long_name"],
        "var2_name": ts2["long_name"],
        "var1_unit": ts1["unit"],
        "var2_unit": ts2["unit"],
        "lat": ts1["lat"],
        "lon": ts1["lon"],
        "pearson_r": round(r, 4),
        "r_squared": round(r * r, 4),
        "n_points": int(len(v1c)),
        "scatter": scatter,
    }


@router.get("/region_stats")
def get_region_stats(
    variable: str = Query(..., description="Variable name"),
    date: str = Query(..., description="Date YYYY-MM-DD"),
    min_lat: float = Query(5.0),
    max_lat: float = Query(22.0),
    min_lon: float = Query(68.0),
    max_lon: float = Query(95.0),
):
    """Return spatial statistics for a variable over a user-defined bounding box
    on a specific date. Used by the region-selection tool in the analytics panel.
    """
    from app.services.netcdf_service import _load_dataset
    import xarray as xr

    ds = _load_dataset()
    if variable not in ds.data_vars:
        raise HTTPException(status_code=404, detail=f"Variable '{variable}' not found")

    try:
        layer = ds[variable].sel(time=date, method="nearest")
        sub = layer.sel(
            latitude=slice(min_lat, max_lat),
            longitude=slice(min_lon, max_lon),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    raw = sub.values.astype(np.float64).ravel()
    valid = raw[~np.isnan(raw)]

    if len(valid) == 0:
        raise HTTPException(status_code=404, detail="No valid data in selected region")

    return {
        "variable": variable,
        "date": str(layer.time.values)[:10],
        "unit": netcdf_service.config.VARIABLE_CATALOGUE.get(variable, {}).get("units", ""),
        "bbox": {"min_lat": min_lat, "max_lat": max_lat, "min_lon": min_lon, "max_lon": max_lon},
        "min_value": round(float(valid.min()), 4),
        "max_value": round(float(valid.max()), 4),
        "mean_value": round(float(valid.mean()), 4),
        "std_value": round(float(valid.std()), 4),
        "median_value": round(float(np.median(valid)), 4),
        "count": int(len(valid)),
    }
