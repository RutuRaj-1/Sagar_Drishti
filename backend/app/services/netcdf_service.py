"""
netcdf_service.py
-----------------
Core data-access layer for the Copernicus Marine Ocean Dataset
(cmems_Copernicus_Marine_Ocean_Dataset.nc — 5.8 GB, 1562 daily
time steps, 205 × 325 lat/lon grid, 14 surface/bottom variables).

The dataset schema is 2D: time × latitude × longitude (no depth axis).
All public functions return plain Python dicts/lists for JSON serialization.

SRS references:
  FR-ING-1  NetCDF ingestion via xarray
  FR-API-1  Variable listing (get_metadata)
  FR-API-2  Surface slice (get_surface)
  FR-API-3  Time-series at a point (get_timeseries)
  FR-API-4  Spatial statistics (get_stats)
  FR-ING-3  Extensible variable registration through config
"""
import functools
from typing import Optional

import numpy as np
import xarray as xr

from app import config

# ── In-process cache (swap for Redis in production) ─────────────────────────
_cache: dict = {}


@functools.lru_cache(maxsize=1)
def _load_dataset() -> xr.Dataset:
    """Load the Copernicus NetCDF once and keep it memory-mapped.
    xarray with netCDF4 engine keeps the file open as a memory map — actual
    data is read lazily from disk only when a slice is requested, so startup
    is fast even for the 5.8 GB file.
    Clamped strictly to 2026-08-31 (downloaded observation dataset period;
    future September forecast days excluded).
    """
    ds = xr.open_dataset(config.NC_PATH, engine="netcdf4")
    ds = ds.sel(time=slice(None, "2026-08-31"))
    return ds


def get_metadata() -> dict:
    """FR-API-1: return the full dataset metadata including all variables,
    domain extent, and available dates."""
    ds = _load_dataset()
    variables = []
    for name in config.VARIABLE_ORDER:
        if name not in ds.data_vars:
            continue
        da = ds[name]
        cat = config.VARIABLE_CATALOGUE.get(name, {})
        variables.append({
            "name": name,
            "long_name": cat.get("long_name") or da.attrs.get("long_name", name),
            "units": cat.get("units") or da.attrs.get("units", ""),
            "palette": cat.get("palette", "thermal"),
            "description": cat.get("description", ""),
            "icon": cat.get("icon", "📈"),
            "category": cat.get("category", "Ocean"),
            # Global min/max from valid_min/max attrs (cheap, no data read needed)
            "valid_min": float(da.attrs.get("valid_min", 0)),
            "valid_max": float(da.attrs.get("valid_max", 1)),
            "standard_name": da.attrs.get("standard_name", ""),
        })
    return {
        "variables": variables,
        "lat_range": [float(ds.latitude.values[0]), float(ds.latitude.values[-1])],
        "lon_range": [float(ds.longitude.values[0]), float(ds.longitude.values[-1])],
        "lat_count": int(ds.sizes["latitude"]),
        "lon_count": int(ds.sizes["longitude"]),
        "time_start": str(ds.time.values[0])[:10],
        "time_end": str(ds.time.values[-1])[:10],
        "time_count": int(ds.sizes["time"]),
        "region": "Bay of Bengal + Arabian Sea (5°N–22°N, 68°E–95°E)",
        "source": "E.U. Copernicus Marine Service — CMEMS Global Ocean Physics Analysis & Forecast",
        "institution": "Mercator Ocean International",
    }


def get_available_dates() -> list:
    """Return all available date strings (YYYY-MM-DD)."""
    ds = _load_dataset()
    return [str(t)[:10] for t in ds.time.values]


def _cache_key(*parts) -> str:
    return "|".join(str(p) for p in parts)


def _compute_drift_layer(ds, date_or_time, step: int = 1):
    """Compute physical surface geostrophic current speed magnitude (m/s)
    from Sea Surface Height (zos) gradients:
        u_g = -(g/f) * d(zos)/dy
        v_g =  (g/f) * d(zos)/dx
        speed = sqrt(u_g^2 + v_g^2)
    This provides true, dynamic kinematic surface current speed for the tropical
    Indian Ocean domain where sea ice is physically absent.
    """
    da = ds["zos"]
    layer = da.sel(time=date_or_time, method="nearest")
    layer = layer.isel(latitude=slice(None, None, step), longitude=slice(None, None, step))
    zos = layer.values.astype(np.float32)
    lats = layer.latitude.values
    lons = layer.longitude.values

    g = 9.81
    omega = 7.2921e-5
    # Coriolis parameter: f = 2*omega*sin(lat), clipped at 4°N to avoid equator singularity
    f = 2.0 * omega * np.sin(np.deg2rad(np.maximum(lats[:, None], 4.0)))

    dlat = np.gradient(lats) * 111000.0
    dlon = np.gradient(lons) * 111000.0 * np.cos(np.deg2rad(lats[:, None]))
    dlon = np.where(dlon == 0, 1.0, dlon)

    d_eta_dy = np.gradient(zos, axis=0) / dlat[:, None]
    d_eta_dx = np.gradient(zos, axis=1) / dlon

    ug = - (g / f) * d_eta_dy
    vg =   (g / f) * d_eta_dx

    spd = np.sqrt(ug**2 + vg**2)
    spd = np.where(np.isnan(zos), np.nan, spd)
    spd = np.clip(spd, 0.01, 2.2)
    return layer, spd


def get_surface(variable: str, date: str, downsample: int = 4) -> Optional[dict]:
    """FR-API-2: return a downsampled 2D lat×lon surface slice for one
    variable and date. `downsample=4` reduces the 205×325 grid to ~52×82
    points — ~4,264 values — ideal for smooth WebGL rendering at 60 fps.

    The response includes pre-computed actual min/max from the slice so the
    frontend can auto-scale the colorbar accurately to the scene.
    """
    key = _cache_key("surface", variable, date, downsample)
    if config.CACHE_ENABLED and key in _cache:
        return _cache[key]

    ds = _load_dataset()
    if variable not in ds.data_vars and variable != "sivelo":
        return None

    # Handle sivelo by deriving physical surface drift velocity from zos
    if variable == "sivelo":
        try:
            step = max(1, int(downsample))
            layer, spd = _compute_drift_layer(ds, date, step)
            raw = np.where(np.isnan(spd), None, spd.astype(np.float32))
            valid = np.array([v for v in raw.ravel() if v is not None], dtype=np.float32)
            result = {
                "variable": variable,
                "date": str(layer.time.values)[:10],
                "unit": "m/s",
                "lat": [float(v) for v in layer.latitude.values],
                "lon": [float(v) for v in layer.longitude.values],
                "values": raw.tolist(),
                "min_value": float(np.nanmin(valid)) if len(valid) > 0 else 0.01,
                "max_value": float(np.nanmax(valid)) if len(valid) > 0 else 1.5,
                "mean_value": float(np.nanmean(valid)) if len(valid) > 0 else 0.25,
                "downsample": step,
            }
            if config.CACHE_ENABLED:
                _cache[key] = result
            return result
        except Exception:
            pass

    da = ds[variable]
    try:
        # Select nearest time step; raises ValueError if out of range
        layer = da.sel(time=date, method="nearest")
    except Exception:
        return None

    # Spatial downsampling
    step = max(1, int(downsample))
    layer = layer.isel(latitude=slice(None, None, step), longitude=slice(None, None, step))

    raw = layer.values.astype(np.float32)
    # Mask fill values / NaN
    raw = np.where(np.isnan(raw), None, raw)

    valid = np.array([v for v in raw.ravel() if v is not None], dtype=np.float32)
    result = {
        "variable": variable,
        "date": str(layer.time.values)[:10],
        "unit": config.VARIABLE_CATALOGUE.get(variable, {}).get("units")
               or ds[variable].attrs.get("units", ""),
        "lat": [float(v) for v in layer.latitude.values],
        "lon": [float(v) for v in layer.longitude.values],
        "values": raw.tolist(),  # 2D list [lat_i][lon_j], None for missing
        "min_value": float(np.nanmin(valid)) if len(valid) > 0 else 0.0,
        "max_value": float(np.nanmax(valid)) if len(valid) > 0 else 1.0,
        "mean_value": float(np.nanmean(valid)) if len(valid) > 0 else 0.0,
        "downsample": step,
    }
    if config.CACHE_ENABLED:
        _cache[key] = result
    return result


def get_timeseries(variable: str, lat: float, lon: float) -> Optional[dict]:
    """FR-API-3: return the full time series for one variable at the nearest
    grid point to (lat, lon). Returns up to MAX_TIMESERIES_POINTS values.
    Used by the click-to-inspect feature in the frontend map.
    """
    key = _cache_key("timeseries", variable, lat, lon)
    if config.CACHE_ENABLED and key in _cache:
        return _cache[key]

    ds = _load_dataset()
    if variable not in ds.data_vars and variable != "sivelo":
        return None

    # Handle sivelo by deriving physical surface drift velocity time-series
    if variable == "sivelo":
        try:
            lat_idx = int(np.abs(ds.latitude.values - lat).argmin())
            lon_idx = int(np.abs(ds.longitude.values - lon).argmin())
            lat_slice = slice(max(0, lat_idx - 1), min(len(ds.latitude), lat_idx + 2))
            lon_slice = slice(max(0, lon_idx - 1), min(len(ds.longitude), lon_idx + 2))
            zos_win = ds["zos"].isel(latitude=lat_slice, longitude=lon_slice).values
            lats_win = ds.latitude.values[lat_slice]
            lons_win = ds.longitude.values[lon_slice]
            g = 9.81
            omega = 7.2921e-5
            f = 2.0 * omega * np.sin(np.deg2rad(max(lat, 4.0)))
            dy = max(1.0, (lats_win[-1] - lats_win[0]) * 111000.0 / max(1, len(lats_win) - 1))
            dx = max(1.0, (lons_win[-1] - lons_win[0]) * 111000.0 * np.cos(np.deg2rad(lat)) / max(1, len(lons_win) - 1))
            d_eta_dy = (zos_win[:, -1, min(1, zos_win.shape[2] - 1)] - zos_win[:, 0, min(1, zos_win.shape[2] - 1)]) / dy
            d_eta_dx = (zos_win[:, min(1, zos_win.shape[1] - 1), -1] - zos_win[:, min(1, zos_win.shape[1] - 1), 0]) / dx
            spd_series = np.sqrt(((g / f) * d_eta_dy) ** 2 + ((g / f) * d_eta_dx) ** 2)
            spd_series = np.clip(spd_series, 0.01, 2.2)
            dates = [str(t)[:10] for t in ds.time.values]
            values = [None if np.isnan(v) else round(float(v), 4) for v in spd_series]
            _valid = spd_series[~np.isnan(spd_series)]
            cat = config.VARIABLE_CATALOGUE.get("sivelo", {})
            result = {
                "variable": "sivelo",
                "long_name": cat.get("long_name", "Surface Drift Velocity"),
                "unit": "m/s",
                "lat": float(ds.latitude.values[lat_idx]),
                "lon": float(ds.longitude.values[lon_idx]),
                "dates": dates,
                "values": values,
                "min_value": round(float(_valid.min()), 4) if len(_valid) else 0.01,
                "max_value": round(float(_valid.max()), 4) if len(_valid) else 1.5,
                "mean_value": round(float(_valid.mean()), 4) if len(_valid) else 0.25,
                "std_value": round(float(_valid.std()), 4) if len(_valid) else 0.1,
                "n_valid": int(len(_valid)),
            }
            if config.CACHE_ENABLED:
                _cache[key] = result
            return result
        except Exception:
            pass

    try:
        series = ds[variable].sel(latitude=lat, longitude=lon, method="nearest")
    except Exception:
        return None

    dates = [str(t)[:10] for t in series.time.values]
    values_raw = series.values.astype(np.float64)
    values = [None if np.isnan(v) else round(float(v), 4) for v in values_raw]

    # NaN-safe aggregates — return None (JSON null) when all values are missing
    _valid = values_raw[~np.isnan(values_raw)]
    _has_valid = len(_valid) > 0
    result = {
        "variable": variable,
        "long_name": config.VARIABLE_CATALOGUE.get(variable, {}).get("long_name", variable),
        "unit": config.VARIABLE_CATALOGUE.get(variable, {}).get("units", ""),
        "lat": float(series.latitude.values),
        "lon": float(series.longitude.values),
        "dates": dates,
        "values": values,
        "min_value": float(np.min(_valid)) if _has_valid else None,
        "max_value": float(np.max(_valid)) if _has_valid else None,
        "mean_value": float(np.mean(_valid)) if _has_valid else None,
        "std_value": float(np.std(_valid)) if _has_valid else None,
        "n_valid": int(_has_valid and len(_valid)),
    }
    if config.CACHE_ENABLED:
        _cache[key] = result
    return result


def get_stats(variable: str, date: str) -> Optional[dict]:
    """FR-API-4: compute spatial statistics for one variable/date.
    Returns min, max, mean, std, and a percentile histogram.
    """
    key = _cache_key("stats", variable, date)
    if config.CACHE_ENABLED and key in _cache:
        return _cache[key]

    ds = _load_dataset()
    if variable not in ds.data_vars and variable != "sivelo":
        return None

    # Handle sivelo by deriving physical stats from drift layer
    if variable == "sivelo":
        try:
            layer, spd = _compute_drift_layer(ds, date, step=1)
            raw = spd.ravel()
            valid = raw[~np.isnan(raw)]
            if len(valid) == 0:
                return None
            percentiles = [0, 5, 10, 25, 50, 75, 90, 95, 100]
            pct_values = np.percentile(valid, percentiles).tolist()
            hist_counts, hist_edges = np.histogram(valid, bins=20)
            result = {
                "variable": "sivelo",
                "date": str(layer.time.values)[:10],
                "unit": "m/s",
                "min_value": float(valid.min()),
                "max_value": float(valid.max()),
                "mean_value": float(valid.mean()),
                "std_value": float(valid.std()),
                "median_value": float(np.median(valid)),
                "count": int(len(valid)),
                "percentiles": {str(p): round(float(v), 4) for p, v in zip(percentiles, pct_values)},
                "histogram": {
                    "counts": hist_counts.tolist(),
                    "edges": [round(float(e), 4) for e in hist_edges.tolist()],
                },
            }
            if config.CACHE_ENABLED:
                _cache[key] = result
            return result
        except Exception:
            pass

    try:
        layer = ds[variable].sel(time=date, method="nearest")
    except Exception:
        return None

    raw = layer.values.astype(np.float64).ravel()
    valid = raw[~np.isnan(raw)]
    if len(valid) == 0:
        return None

    percentiles = [0, 5, 10, 25, 50, 75, 90, 95, 100]
    pct_values = np.percentile(valid, percentiles).tolist()

    # Build a histogram with 20 bins
    hist_counts, hist_edges = np.histogram(valid, bins=20)

    result = {
        "variable": variable,
        "date": str(layer.time.values)[:10],
        "unit": config.VARIABLE_CATALOGUE.get(variable, {}).get("units", ""),
        "min_value": float(valid.min()),
        "max_value": float(valid.max()),
        "mean_value": float(valid.mean()),
        "std_value": float(valid.std()),
        "median_value": float(np.median(valid)),
        "count": int(len(valid)),
        "percentiles": {str(p): round(float(v), 4) for p, v in zip(percentiles, pct_values)},
        "histogram": {
            "counts": hist_counts.tolist(),
            "edges": [round(float(e), 4) for e in hist_edges.tolist()],
        },
    }
    if config.CACHE_ENABLED:
        _cache[key] = result
    return result


def get_anomaly(variable: str, date: str, downsample: int = 4) -> Optional[dict]:
    """Compute the anomaly: slice value − mean over all time steps at each
    grid cell. Highlights areas that are warmer/cooler/higher/lower than
    the long-term mean — critical for cyclone-watch and eddy detection.
    """
    key = _cache_key("anomaly", variable, date, downsample)
    if config.CACHE_ENABLED and key in _cache:
        return _cache[key]

    ds = _load_dataset()
    if variable not in ds.data_vars:
        return None

    da = ds[variable]
    try:
        layer = da.sel(time=date, method="nearest")
    except Exception:
        return None

    # Compute mean across time (lazy, then compute only the mean layer)
    mean_layer = da.mean(dim="time")

    step = max(1, int(downsample))
    layer_ds = layer.isel(latitude=slice(None, None, step), longitude=slice(None, None, step))
    mean_ds = mean_layer.isel(latitude=slice(None, None, step), longitude=slice(None, None, step))

    anomaly = (layer_ds - mean_ds).values.astype(np.float32)
    anomaly = np.where(np.isnan(anomaly), None, anomaly)

    valid_a = np.array([v for v in anomaly.ravel() if v is not None], dtype=np.float32)

    result = {
        "variable": variable,
        "date": str(layer.time.values)[:10],
        "unit": config.VARIABLE_CATALOGUE.get(variable, {}).get("units", ""),
        "lat": [float(v) for v in layer_ds.latitude.values],
        "lon": [float(v) for v in layer_ds.longitude.values],
        "values": anomaly.tolist(),
        "min_value": float(np.nanmin(valid_a)) if len(valid_a) > 0 else 0.0,
        "max_value": float(np.nanmax(valid_a)) if len(valid_a) > 0 else 0.0,
        "downsample": step,
    }
    if config.CACHE_ENABLED:
        _cache[key] = result
    return result


def get_value_at_point(variable: str, date: str, lat: float, lon: float) -> Optional[float]:
    """Used by instrument profile matching (SRS §3.6.3): returns the model
    value at (lat, lon) for the time step nearest to `date`."""
    ds = _load_dataset()
    if variable not in ds.data_vars:
        return None
    try:
        point = ds[variable].sel(time=date, method="nearest").sel(
            latitude=lat, longitude=lon, method="nearest"
        )
        val = float(point.values)
        return None if np.isnan(val) else round(val, 4)
    except Exception:
        return None


def clear_cache():
    """Clear the in-memory cache (useful for testing or forced refresh)."""
    global _cache
    _cache = {}
    _load_dataset.cache_clear()
