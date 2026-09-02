"""
volumetric_service.py
---------------------
Service layer for 4D Volumetric Ocean Data (time × depth × lat × lon).
Reads `ocean_model_sample.nc` containing multi-depth hydrographic variables
(temperature, salinity, chlorophyll) and hydrodynamic velocity components
(u_current, v_current).

Enables:
  - FR-2.3: True vertical depth slider across 8 depth levels (0m to 1000m)
  - FR-2.5: Current vector arrow field extraction (u, v velocity components)
  - FR-2.6: 3D Volumetric Marching Cubes isosurface extraction
  - FR-3.3: Dual-line model-vs-observation continuous depth comparison
"""
import functools
import os
import math
from typing import Optional, List, Dict, Any

import numpy as np
import xarray as xr

from app import config

_cache: dict = {}

VOLUMETRIC_VARS = {
    "temperature": {
        "long_name": "Potential Temperature",
        "units": "°C",
        "palette": "thermal",
        "category": "Temperature",
        "icon": "🌡️",
        "color": "#ff6b6b",
    },
    "salinity": {
        "long_name": "Practical Salinity",
        "units": "PSU",
        "palette": "haline",
        "category": "Salinity",
        "icon": "🧂",
        "color": "#4ecdc4",
    },
    "chlorophyll": {
        "long_name": "Chlorophyll-a Concentration",
        "units": "mg/m³",
        "palette": "viridis",
        "category": "Biology",
        "icon": "🌿",
        "color": "#fdcb6e",
    },
    "u_current": {
        "long_name": "Zonal Velocity (Eastward)",
        "units": "m/s",
        "palette": "deep",
        "category": "Currents",
        "icon": "➡️",
        "color": "#74b9ff",
    },
    "v_current": {
        "long_name": "Meridional Velocity (Northward)",
        "units": "m/s",
        "palette": "deep",
        "category": "Currents",
        "icon": "⬆️",
        "color": "#a29bfe",
    },
}


@functools.lru_cache(maxsize=1)
def _load_volumetric_dataset() -> xr.Dataset:
    """Load the 4D ocean model dataset."""
    if not os.path.exists(config.SAMPLE_NC_PATH):
        raise FileNotFoundError(f"4D Model NetCDF not found at {config.SAMPLE_NC_PATH}")
    ds = xr.open_dataset(config.SAMPLE_NC_PATH, engine="netcdf4")
    return ds


def get_volumetric_metadata() -> Dict[str, Any]:
    """Return available 4D metadata including depth levels, variables, and dates."""
    ds = _load_volumetric_dataset()
    
    lat_key = "lat" if "lat" in ds.coords else "latitude"
    lon_key = "lon" if "lon" in ds.coords else "longitude"
    
    depths = [float(d) for d in ds.depth.values]
    dates = [str(t)[:10] for t in ds.time.values]
    
    var_list = []
    for vname, info in VOLUMETRIC_VARS.items():
        if vname in ds.data_vars:
            var_list.append({
                "name": vname,
                "long_name": info["long_name"],
                "units": info["units"],
                "palette": info["palette"],
                "category": info["category"],
                "icon": info["icon"],
                "color": info["color"],
                "min_value": float(ds[vname].values.min()),
                "max_value": float(ds[vname].values.max()),
            })
            
    return {
        "variables": var_list,
        "depth_levels": depths,
        "dates": dates,
        "lat_range": [float(ds[lat_key].values[0]), float(ds[lat_key].values[-1])],
        "lon_range": [float(ds[lon_key].values[0]), float(ds[lon_key].values[-1])],
        "lat_count": int(ds.sizes[lat_key]),
        "lon_count": int(ds.sizes[lon_key]),
        "has_currents": ("u_current" in ds.data_vars and "v_current" in ds.data_vars),
    }


def get_depth_slice(variable: str, date: str, depth: float = 0.0, downsample: int = 1) -> Optional[Dict[str, Any]]:
    """Return a 2D horizontal slice for a specific variable, date, and depth level."""
    ds = _load_volumetric_dataset()
    if variable not in ds.data_vars:
        return None

    lat_key = "lat" if "lat" in ds.coords else "latitude"
    lon_key = "lon" if "lon" in ds.coords else "longitude"

    try:
        sub = ds[variable].sel(time=date, depth=depth, method="nearest")
    except Exception:
        return None

    step = max(1, int(downsample))
    sub = sub.isel({lat_key: slice(None, None, step), lon_key: slice(None, None, step)})

    raw = sub.values.astype(np.float32)
    valid = raw[~np.isnan(raw)]
    raw_list = np.where(np.isnan(raw), None, raw).tolist()

    actual_depth = float(sub.depth.values)
    actual_date = str(sub.time.values)[:10]

    return {
        "variable": variable,
        "date": actual_date,
        "depth": actual_depth,
        "unit": VOLUMETRIC_VARS.get(variable, {}).get("units", ""),
        "lat": [float(v) for v in sub[lat_key].values],
        "lon": [float(v) for v in sub[lon_key].values],
        "values": raw_list,
        "min_value": float(valid.min()) if len(valid) > 0 else 0.0,
        "max_value": float(valid.max()) if len(valid) > 0 else 1.0,
        "mean_value": float(valid.mean()) if len(valid) > 0 else 0.0,
        "downsample": step,
    }


def get_current_vectors(date: str, depth: float = 0.0, downsample: int = 2) -> Optional[Dict[str, Any]]:
    """
    Extract horizontal u (eastward) and v (northward) ocean velocity vectors
    at a specific date and depth. Computes velocity magnitude (speed) and direction.
    """
    ds = _load_volumetric_dataset()
    if "u_current" not in ds.data_vars or "v_current" not in ds.data_vars:
        return None

    lat_key = "lat" if "lat" in ds.coords else "latitude"
    lon_key = "lon" if "lon" in ds.coords else "longitude"

    try:
        u_slice = ds["u_current"].sel(time=date, depth=depth, method="nearest")
        v_slice = ds["v_current"].sel(time=date, depth=depth, method="nearest")
    except Exception:
        return None

    step = max(1, int(downsample))
    u_sub = u_slice.isel({lat_key: slice(None, None, step), lon_key: slice(None, None, step)})
    v_sub = v_slice.isel({lat_key: slice(None, None, step), lon_key: slice(None, None, step)})

    u_vals = u_sub.values.astype(np.float32)
    v_vals = v_sub.values.astype(np.float32)

    lats = [float(v) for v in u_sub[lat_key].values]
    lons = [float(v) for v in u_sub[lon_key].values]

    speed = np.sqrt(u_vals**2 + v_vals**2)
    
    # Build list of point vectors for easy vector glyph & particle rendering
    points = []
    for i, lat_val in enumerate(lats):
        for j, lon_val in enumerate(lons):
            u_ij = float(u_vals[i, j])
            v_ij = float(v_vals[i, j])
            spd = float(speed[i, j])
            if not np.isnan(u_ij) and not np.isnan(v_ij) and spd > 0.001:
                # Math angle in degrees (0 = East, 90 = North)
                angle_deg = math.degrees(math.atan2(v_ij, u_ij))
                points.append({
                    "lat": round(lat_val, 4),
                    "lon": round(lon_val, 4),
                    "u": round(u_ij, 4),
                    "v": round(v_ij, 4),
                    "speed": round(spd, 4),
                    "angle_deg": round(angle_deg, 2),
                })

    return {
        "date": str(u_slice.time.values)[:10],
        "depth": float(u_slice.depth.values),
        "lat_count": len(lats),
        "lon_count": len(lons),
        "min_speed": float(np.nanmin(speed)),
        "max_speed": float(np.nanmax(speed)),
        "mean_speed": float(np.nanmean(speed)),
        "points": points,
    }


def get_model_depth_profile(variable: str, lat: float, lon: float, date: str) -> Optional[Dict[str, Any]]:
    """
    Extract a vertical depth profile (all depth levels) at a specific (lat, lon)
    for model-vs-Argo co-location comparison.
    """
    ds = _load_volumetric_dataset()
    if variable not in ds.data_vars:
        # Fallback to temperature if variable not in sample dataset
        variable = "temperature"

    lat_key = "lat" if "lat" in ds.coords else "latitude"
    lon_key = "lon" if "lon" in ds.coords else "longitude"

    try:
        prof = ds[variable].sel(time=date, method="nearest").sel(
            {lat_key: lat, lon_key: lon}, method="nearest"
        )
    except Exception:
        return None

    depths = [float(d) for d in ds.depth.values]
    vals = [None if np.isnan(v) else round(float(v), 4) for v in prof.values]

    return {
        "variable": variable,
        "date": str(prof.time.values)[:10],
        "lat": float(prof[lat_key].values),
        "lon": float(prof[lon_key].values),
        "depths": depths,
        "values": vals,
        "unit": VOLUMETRIC_VARS.get(variable, {}).get("units", ""),
        "long_name": VOLUMETRIC_VARS.get(variable, {}).get("long_name", variable),
    }


def get_volume_for_isosurface(variable: str = "temperature", date: str = "2026-08-31") -> Optional[Dict[str, Any]]:
    """
    Return 3D voxel grid array (n_depth × n_lat × n_lon) with coordinates and bounds
    for client-side Marching Cubes isosurface extraction.
    """
    ds = _load_volumetric_dataset()
    if variable not in ds.data_vars:
        variable = "temperature"

    lat_key = "lat" if "lat" in ds.coords else "latitude"
    lon_key = "lon" if "lon" in ds.coords else "longitude"

    try:
        vol = ds[variable].sel(time=date, method="nearest")
    except Exception:
        return None

    raw_3d = vol.values.astype(np.float32)  # shape: (depth, lat, lon)
    
    return {
        "variable": variable,
        "date": str(vol.time.values)[:10],
        "unit": VOLUMETRIC_VARS.get(variable, {}).get("units", ""),
        "depths": [float(d) for d in ds.depth.values],
        "lats": [float(l) for l in ds[lat_key].values],
        "lons": [float(l) for l in ds[lon_key].values],
        "shape": list(raw_3d.shape),
        "min_value": float(np.nanmin(raw_3d)),
        "max_value": float(np.nanmax(raw_3d)),
        # Flattened 1D array for compact transmission
        "flat_values": [round(float(v), 3) if not np.isnan(v) else -9999.0 for v in raw_3d.ravel()],
    }
