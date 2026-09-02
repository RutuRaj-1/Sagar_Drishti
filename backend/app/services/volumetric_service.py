"""
volumetric_service.py
---------------------
Service layer for the REAL 4D Volumetric Ocean Data from Copernicus Marine Service (CMEMS).
Source: Global Ocean Physics Analysis and Forecast — ANFC (Copernicus Marine)
Products: cmems_mod_glo_phy-thetao/so/cur_anfc_0.083deg_P1D-m
File: real_ocean_model_4d.nc  (time × depth × latitude × longitude)
Temporal coverage: August 25–31, 2026 (7 time steps)

Real CMEMS variable mapping
  thetao  → temperature  (°C,   30 depth levels, 1.5m–454m)
  so      → salinity     (PSU,  30 depth levels)
  uo      → u_current    (eastward  velocity m/s)
  vo      → v_current    (northward velocity m/s)

Enables:
  - FR-2.3: True vertical depth slider across 30 real depth levels (1.5m–454m)
  - FR-2.5: Current vector arrow field from real CMEMS uo/vo fields
  - FR-2.6: 3D Volumetric Marching Cubes isosurface from real 4D grid
  - FR-3.3: Dual-line model-vs-observation depth comparison
"""
import functools
import os
import math
from typing import Optional, List, Dict, Any

import numpy as np
import xarray as xr

from app import config

_cache: dict = {}

# ── Public-facing variable catalogue (mapped FROM real CMEMS names) ──────────
# API users address variables by friendly name; service translates to NC name.
VOLUMETRIC_VARS = {
    "temperature": {
        "nc_name":   "thetao",          # real CMEMS variable name in the .nc file
        "long_name": "Sea Water Potential Temperature",
        "units":     "°C",
        "palette":   "thermal",
        "category":  "Temperature",
        "icon":      "🌡️",
        "color":     "#ff6b6b",
        "color_dark": "#c0392b",
        "gradient":  "linear-gradient(135deg, #c0392b, #ff6b6b)",
    },
    "salinity": {
        "nc_name":   "so",
        "long_name": "Sea Water Practical Salinity",
        "units":     "PSU",
        "palette":   "haline",
        "category":  "Salinity",
        "icon":      "🧂",
        "color":     "#4ecdc4",
        "color_dark": "#0097a7",
        "gradient":  "linear-gradient(135deg, #0097a7, #4ecdc4)",
    },
    "u_current": {
        "nc_name":   "uo",
        "long_name": "Eastward Sea Water Velocity",
        "units":     "m/s",
        "palette":   "deep",
        "category":  "Currents",
        "icon":      "➡️",
        "color":     "#74b9ff",
        "color_dark": "#0984e3",
        "gradient":  "linear-gradient(135deg, #0984e3, #74b9ff)",
    },
    "v_current": {
        "nc_name":   "vo",
        "long_name": "Northward Sea Water Velocity",
        "units":     "m/s",
        "palette":   "deep",
        "category":  "Currents",
        "icon":      "⬆️",
        "color":     "#a29bfe",
        "color_dark": "#6c5ce7",
        "gradient":  "linear-gradient(135deg, #6c5ce7, #a29bfe)",
    },
}

# Map friendly name → real NC variable name for internal use
_VARMAP: Dict[str, str] = {k: v["nc_name"] for k, v in VOLUMETRIC_VARS.items()}


def _to_nc_name(variable: str) -> str:
    """Translate friendly variable name to the real CMEMS NetCDF variable name."""
    return _VARMAP.get(variable, variable)


@functools.lru_cache(maxsize=1)
def _load_volumetric_dataset() -> xr.Dataset:
    """Load the real 4D CMEMS NetCDF dataset (cached after first load)."""
    path = config.REAL_4D_NC_PATH
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Real 4D CMEMS NetCDF not found at {path}. "
            "Download it with copernicusmarine CLI (see backend/data/download_real_4d_cmems.py)."
        )
    ds = xr.open_dataset(path, engine="netcdf4")
    return ds


def _coord_keys(ds: xr.Dataset):
    """Return (lat_key, lon_key) dimension names — real CMEMS uses 'latitude'/'longitude'."""
    lat_key = "latitude" if "latitude" in ds.coords else "lat"
    lon_key = "longitude" if "longitude" in ds.coords else "lon"
    return lat_key, lon_key


# ─────────────────────────────────────────────────────────────────────────────
#  PUBLIC API FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def get_volumetric_metadata() -> Dict[str, Any]:
    """
    Return metadata about the 4D real dataset:
    - Available variables with ranges (data-derived, not hard-coded)
    - 34 real depth levels from CMEMS (1.54m → 902.34m)
    - Actual temporal coverage
    - Spatial extent
    """
    ds = _load_volumetric_dataset()
    lat_key, lon_key = _coord_keys(ds)

    depths = [round(float(d), 2) for d in ds.depth.values]
    dates  = [str(t)[:10] for t in ds.time.values]

    var_list = []
    for friendly_name, info in VOLUMETRIC_VARS.items():
        nc_name = info["nc_name"]
        if nc_name not in ds.data_vars:
            continue
        raw = ds[nc_name].values.astype(np.float32)
        valid = raw[~np.isnan(raw)]
        var_list.append({
            "name":       friendly_name,
            "nc_name":    nc_name,
            "long_name":  info["long_name"],
            "units":      info["units"],
            "palette":    info["palette"],
            "category":   info["category"],
            "icon":       info["icon"],
            "color":      info["color"],
            "min_value":  round(float(valid.min()), 3) if len(valid) > 0 else None,
            "max_value":  round(float(valid.max()), 3) if len(valid) > 0 else None,
            "mean_value": round(float(valid.mean()), 3) if len(valid) > 0 else None,
        })

    return {
        "source":      "Copernicus Marine Service — MOI GLO12 (Mercator Ocean International)",
        "product":     "GLOBAL_ANALYSISFORECAST_PHY_001_024",
        "variables":   var_list,
        "depth_levels": depths,
        "n_depths":    len(depths),
        "dates":       dates,
        "lat_range":   [float(ds[lat_key].values[0]),  float(ds[lat_key].values[-1])],
        "lon_range":   [float(ds[lon_key].values[0]),  float(ds[lon_key].values[-1])],
        "lat_count":   int(ds.sizes[lat_key]),
        "lon_count":   int(ds.sizes[lon_key]),
        "has_currents": ("uo" in ds.data_vars and "vo" in ds.data_vars),
        "has_temperature": "thetao" in ds.data_vars,
        "has_salinity":    "so" in ds.data_vars,
    }


def get_depth_slice(
    variable: str,
    date: Optional[str] = None,
    depth: float = 0.0,
    downsample: int = 1,
) -> Optional[Dict[str, Any]]:
    """
    Return a 2D horizontal lat-lon slice of a real CMEMS variable
    at the nearest available depth level and date.

    Parameters
    ----------
    variable  : friendly name ('temperature', 'salinity', 'u_current', 'v_current')
    date      : ISO date string YYYY-MM-DD (defaults to latest time step)
    depth     : target depth in metres (snapped to nearest real depth level)
    downsample: spatial downsampling factor (1 = full 205×325 grid)
    """
    ds = _load_volumetric_dataset()
    nc_var = _to_nc_name(variable)
    if nc_var not in ds.data_vars:
        return None

    lat_key, lon_key = _coord_keys(ds)

    try:
        if date:
            sub = ds[nc_var].sel(time=date, depth=depth, method="nearest")
        else:
            # Default to latest time step
            sub = ds[nc_var].isel(time=-1).sel(depth=depth, method="nearest")
    except Exception:
        return None

    step = max(1, int(downsample))
    sub  = sub.isel(**{lat_key: slice(None, None, step), lon_key: slice(None, None, step)})

    raw    = sub.values.astype(np.float32)
    valid  = raw[~np.isnan(raw)]
    raw_list = [[None if np.isnan(v) else round(float(v), 3) for v in row] for row in raw]

    return {
        "variable":   variable,
        "nc_name":    nc_var,
        "date":       str(sub.time.values)[:10],
        "depth":      round(float(sub.depth.values), 2),
        "unit":       VOLUMETRIC_VARS.get(variable, {}).get("units", ""),
        "long_name":  VOLUMETRIC_VARS.get(variable, {}).get("long_name", variable),
        "lat":        [round(float(v), 4) for v in sub[lat_key].values],
        "lon":        [round(float(v), 4) for v in sub[lon_key].values],
        "values":     raw_list,
        "min_value":  round(float(valid.min()),  3) if len(valid) > 0 else None,
        "max_value":  round(float(valid.max()),  3) if len(valid) > 0 else None,
        "mean_value": round(float(valid.mean()), 3) if len(valid) > 0 else None,
        "downsample": step,
        "source":     "CMEMS MOI GLO12",
    }


def get_current_vectors(
    date: Optional[str] = None,
    depth: float = 0.0,
    downsample: int = 3,
) -> Optional[Dict[str, Any]]:
    """
    Extract real CMEMS u (uo / eastward) and v (vo / northward) ocean velocity vectors
    at a specific date and depth level.

    Returns per-point dicts with lat, lon, u, v, speed, and direction angle
    suitable for rendering arrow/cone glyphs in Three.js / Leaflet.
    """
    ds = _load_volumetric_dataset()
    if "uo" not in ds.data_vars or "vo" not in ds.data_vars:
        return None

    lat_key, lon_key = _coord_keys(ds)

    try:
        sel_kwargs = dict(depth=depth, method="nearest")
        if date:
            u_slice = ds["uo"].sel(time=date, **sel_kwargs)
            v_slice = ds["vo"].sel(time=date, **sel_kwargs)
        else:
            u_slice = ds["uo"].isel(time=-1).sel(**sel_kwargs)
            v_slice = ds["vo"].isel(time=-1).sel(**sel_kwargs)
    except Exception:
        return None

    step  = max(1, int(downsample))
    u_sub = u_slice.isel(**{lat_key: slice(None, None, step), lon_key: slice(None, None, step)})
    v_sub = v_slice.isel(**{lat_key: slice(None, None, step), lon_key: slice(None, None, step)})

    u_vals = u_sub.values.astype(np.float32)
    v_vals = v_sub.values.astype(np.float32)
    lats   = [float(v) for v in u_sub[lat_key].values]
    lons   = [float(v) for v in u_sub[lon_key].values]
    speed  = np.sqrt(u_vals ** 2 + v_vals ** 2)

    points = []
    for i, lat_val in enumerate(lats):
        for j, lon_val in enumerate(lons):
            u_ij  = float(u_vals[i, j])
            v_ij  = float(v_vals[i, j])
            spd   = float(speed[i, j])
            if np.isnan(u_ij) or np.isnan(v_ij):
                continue
            if spd < 0.005:           # skip near-zero vectors
                continue
            angle_deg = math.degrees(math.atan2(v_ij, u_ij))  # 0°=East, 90°=North
            points.append({
                "lat":       round(lat_val, 4),
                "lon":       round(lon_val, 4),
                "u":         round(u_ij,    4),
                "v":         round(v_ij,    4),
                "speed":     round(spd,     4),
                "angle_deg": round(angle_deg, 2),
            })

    valid_speed = speed[~np.isnan(speed)]
    return {
        "date":       str(u_slice.time.values)[:10],
        "depth":      round(float(u_slice.depth.values), 2),
        "lat_count":  len(lats),
        "lon_count":  len(lons),
        "n_vectors":  len(points),
        "min_speed":  round(float(valid_speed.min()),  4) if len(valid_speed) > 0 else None,
        "max_speed":  round(float(valid_speed.max()),  4) if len(valid_speed) > 0 else None,
        "mean_speed": round(float(valid_speed.mean()), 4) if len(valid_speed) > 0 else None,
        "source":     "CMEMS uo/vo — MOI GLO12",
        "points":     points,
    }


def get_model_depth_profile(
    variable: str,
    lat: float,
    lon: float,
    date: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Extract a real vertical depth profile (all 34 CMEMS depth levels)
    at the nearest grid point to (lat, lon) for the given date.

    Used for model-vs-Argo dual-line comparison chart in the frontend.
    """
    ds = _load_volumetric_dataset()
    nc_var = _to_nc_name(variable)
    if nc_var not in ds.data_vars:
        # Fall back to temperature
        nc_var = "thetao"
        variable = "temperature"

    lat_key, lon_key = _coord_keys(ds)

    try:
        if date:
            da = ds[nc_var].sel(time=date, method="nearest")
        else:
            da = ds[nc_var].isel(time=-1)
        prof = da.sel(**{lat_key: lat, lon_key: lon}, method="nearest")
    except Exception:
        return None

    depths = [round(float(d), 2) for d in ds.depth.values]
    vals   = [None if np.isnan(v) else round(float(v), 4) for v in prof.values]
    valid  = [v for v in vals if v is not None]

    return {
        "variable":  variable,
        "nc_name":   nc_var,
        "date":      str(prof.time.values)[:10],
        "lat":       round(float(prof[lat_key].values), 4),
        "lon":       round(float(prof[lon_key].values), 4),
        "depths":    depths,
        "values":    vals,
        "unit":      VOLUMETRIC_VARS.get(variable, {}).get("units", ""),
        "long_name": VOLUMETRIC_VARS.get(variable, {}).get("long_name", variable),
        "n_levels":  len(depths),
        "n_valid":   len(valid),
        "source":    "CMEMS MOI GLO12 — real 4D profile",
    }


def get_volume_for_isosurface(
    variable: str = "temperature",
    date: Optional[str] = None,
    depth_range: Optional[tuple] = None,
) -> Optional[Dict[str, Any]]:
    """
    Return the full 3D voxel grid (n_depth × n_lat × n_lon) from the real CMEMS dataset
    for client-side Marching Cubes isosurface rendering in Three.js WebGL.

    The grid is spatially downsampled (every 4th lat/lon point) and depth-
    filtered to keep the response payload manageable (~few MB).

    Parameters
    ----------
    variable    : friendly name ('temperature' or 'salinity')
    date        : ISO date string, defaults to latest time step
    depth_range : (min_m, max_m) tuple to restrict depth extent (default: 0–500m)
    """
    ds = _load_volumetric_dataset()
    nc_var = _to_nc_name(variable)
    if nc_var not in ds.data_vars:
        nc_var = "thetao"
        variable = "temperature"

    lat_key, lon_key = _coord_keys(ds)

    # Depth filtering — restrict to upper 500 m by default for manageable payload
    if depth_range is None:
        depth_range = (0.0, 500.0)
    d_min, d_max = depth_range

    try:
        if date:
            da = ds[nc_var].sel(time=date, method="nearest")
        else:
            da = ds[nc_var].isel(time=-1)
        # Slice depths within range
        da = da.sel(depth=slice(d_min, d_max))
    except Exception:
        return None

    # Downsample spatial grid — every 4th point to control payload
    SPATIAL_STEP = 4
    da = da.isel(
        **{lat_key: slice(None, None, SPATIAL_STEP),
           lon_key: slice(None, None, SPATIAL_STEP)}
    )

    raw_3d = da.values.astype(np.float32)   # shape: (depth, lat, lon)
    valid  = raw_3d[~np.isnan(raw_3d)]

    return {
        "variable":   variable,
        "nc_name":    nc_var,
        "date":       str(da.time.values)[:10],
        "unit":       VOLUMETRIC_VARS.get(variable, {}).get("units", ""),
        "long_name":  VOLUMETRIC_VARS.get(variable, {}).get("long_name", variable),
        "depths":     [round(float(d), 2) for d in da.depth.values],
        "lats":       [round(float(v), 4) for v in da[lat_key].values],
        "lons":       [round(float(v), 4) for v in da[lon_key].values],
        "shape":      list(raw_3d.shape),     # [n_depth, n_lat, n_lon]
        "min_value":  round(float(valid.min()),  3) if len(valid) > 0 else None,
        "max_value":  round(float(valid.max()),  3) if len(valid) > 0 else None,
        "mean_value": round(float(valid.mean()), 3) if len(valid) > 0 else None,
        "source":     "CMEMS MOI GLO12 — real 3D volume",
        # Flattened array — NaN encoded as -9999 for compact JSON transmission
        "flat_values": [
            round(float(v), 3) if not np.isnan(v) else -9999.0
            for v in raw_3d.ravel()
        ],
    }
