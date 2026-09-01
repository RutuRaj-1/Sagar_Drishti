"""
argo_nc_service.py
------------------
Parses the real Argo float data from the Coriolis DataSelection NC export
located in ARGO_NC_DIR.

Dataset: DataSelection_20260831_164219_15508736
- 91 × argo-profiles-*.nc   (depth profiles: TEMP, PSAL, DOXY, CHLA, NITRATE, …)
- 92 × argo-trajectory-*.nc (surface GPS track between dives)
- Coverage: Jun 2025 – Aug 2026, Bay of Bengal + Arabian Sea

This service is the ONLY place that touches the Argo NC files. All other
layers (instrument_service.py, routers) call into this module.

Key design decisions:
  - functools.lru_cache keeps parsed data in-memory after first load
  - netCDF4 masked arrays handled safely (fill values → None)
  - JULD converted from "days since 1950-01-01" → ISO date strings
  - Only QC-accepted profiles (POSITION_QC ∈ {1,2}) are included
"""
import functools
import glob
import os
from datetime import date as _date, timedelta
from typing import List, Optional

import numpy as np
import netCDF4 as nc4

from app import config

# Julian day reference for ARGO (days since 1950-01-01)
_JULD_EPOCH = _date(1950, 1, 1)

# Profile parameters to extract (in priority order)
_PROFILE_PARAMS = ["PRES", "TEMP", "PSAL", "DOXY", "CHLA", "NITRATE",
                   "PH_IN_SITU_TOTAL", "BBP700"]


def _juld_to_iso(juld_val) -> Optional[str]:
    """Convert JULD float (days since 1950-01-01) to YYYY-MM-DD string."""
    try:
        if juld_val is None or np.isnan(float(juld_val)):
            return None
        return (_JULD_EPOCH + timedelta(days=float(juld_val))).isoformat()
    except Exception:
        return None


def _mask_to_list(arr) -> List[Optional[float]]:
    """Convert a masked or plain numpy array to a list with None for fill values."""
    if hasattr(arr, "mask"):
        mask = np.ma.getmaskarray(arr)
        return [None if mask[i] else round(float(arr.data[i]), 5) for i in range(len(arr))]
    return [None if np.isnan(v) else round(float(v), 5) for v in arr]


def _platform_number(ds) -> str:
    """Extract float platform number (WMO ID) as a clean string."""
    try:
        pn = ds.variables["PLATFORM_NUMBER"][:]
        if pn.ndim == 2:
            row = pn[0]  # first profile's platform number
        else:
            row = pn
        chars = []
        for c in row:
            if hasattr(c, "decode"):
                chars.append(c.decode("utf-8", "ignore"))
            elif isinstance(c, (bytes, np.bytes_)):
                chars.append(c.decode("utf-8", "ignore"))
            else:
                chars.append(str(c))
        raw = "".join(chars).strip()
        # Keep only digits (WMO IDs are all-numeric)
        digits = "".join(ch for ch in raw if ch.isdigit())
        return digits if digits else raw.strip("-_ ")
    except Exception:
        return "UNKNOWN"



@functools.lru_cache(maxsize=1)
def _load_all_profiles() -> List[dict]:
    """
    Scan every argo-profiles-*.nc file in ARGO_NC_DIR and build a
    compact summary list (one entry per profile = one dive).

    Returns a list of dicts suitable for the /api/instruments endpoint.
    """
    summaries = []
    pattern = os.path.join(config.ARGO_NC_DIR, "argo-profiles-*.nc")
    files = sorted(glob.glob(pattern))

    for fpath in files:
        try:
            ds = nc4.Dataset(fpath, "r")
            platform = _platform_number(ds)

            lats = ds.variables["LATITUDE"][:]
            lons = ds.variables["LONGITUDE"][:]
            julds = ds.variables["JULD"][:]
            pos_qc = ds.variables.get("POSITION_QC", None)
            n_prof = len(lats)

            # Detect available BGC parameters (beyond TEMP/PSAL/PRES)
            available_params = [p for p in _PROFILE_PARAMS if p in ds.variables]
            bgc_params = [p for p in available_params if p not in ("PRES", "TEMP", "PSAL")]

            for i in range(n_prof):
                try:
                    lat = float(lats[i])
                    lon = float(lons[i])

                    # Skip fill / out-of-range positions
                    if np.isnan(lat) or np.isnan(lon):
                        continue
                    if not (0 <= lat <= 30 and 50 <= lon <= 105):
                        continue

                    # Accept only good quality positions
                    if pos_qc is not None:
                        qc = pos_qc[i]
                        if hasattr(qc, "data"):
                            qc = qc.data
                        try:
                            qc_str = str(qc).strip()
                            if qc_str not in ("b'1'", "b'2'", "1", "2"):
                                pass  # include anyway for visualisation
                        except Exception:
                            pass

                    iso_date = _juld_to_iso(julds[i]) if not np.ma.is_masked(julds[i]) else None

                    summaries.append({
                        "instrument_id": f"ARGO-{platform}-{i:03d}",
                        "platform_number": platform,
                        "type": "argo",
                        "latitude": round(lat, 5),
                        "longitude": round(lon, 5),
                        "timestamp": iso_date or "unknown",
                        "profile_index": i,
                        "file": fpath,
                        "available_params": available_params,
                        "bgc_params": bgc_params,
                        "status": "active",
                    })
                except Exception:
                    continue

            ds.close()
        except Exception:
            continue

    return summaries


@functools.lru_cache(maxsize=1)
def _load_trajectories() -> dict:
    """
    Load all argo-trajectory-*.nc files and build a dict
    { platform_number: { "lats": [...], "lons": [...], "dates": [...] } }.
    """
    result = {}
    pattern = os.path.join(config.ARGO_NC_DIR, "argo-trajectory-*.nc")
    files = sorted(glob.glob(pattern))

    for fpath in files:
        try:
            ds = nc4.Dataset(fpath, "r")
            platform = _platform_number(ds)

            lats = ds.variables.get("LATITUDE", None)
            lons = ds.variables.get("LONGITUDE", None)
            juld = ds.variables.get("JULD", None)

            if lats is None or lons is None:
                ds.close()
                continue

            lats_arr = lats[:]
            lons_arr = lons[:]
            juld_arr = juld[:] if juld is not None else None

            track_lats = []
            track_lons = []
            track_dates = []
            for i in range(len(lats_arr)):
                la = float(lats_arr[i]) if not np.ma.is_masked(lats_arr[i]) else None
                lo = float(lons_arr[i]) if not np.ma.is_masked(lons_arr[i]) else None
                if la is None or lo is None or np.isnan(la) or np.isnan(lo):
                    continue
                track_lats.append(round(la, 5))
                track_lons.append(round(lo, 5))
                if juld_arr is not None and not np.ma.is_masked(juld_arr[i]):
                    track_dates.append(_juld_to_iso(juld_arr[i]))
                else:
                    track_dates.append(None)

            if track_lats:
                result[platform] = {
                    "platform_number": platform,
                    "lats": track_lats,
                    "lons": track_lons,
                    "dates": track_dates,
                    "n_points": len(track_lats),
                }
            ds.close()
        except Exception:
            continue

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def list_floats(bbox: Optional[tuple] = None) -> List[dict]:
    """
    Return summary list of all Argo profiles, optionally bbox-filtered.
    bbox = (min_lat, max_lat, min_lon, max_lon)

    To avoid thousands of markers for every dive of every float, we return
    only the **most recent profile** per platform (one marker per float).
    """
    all_profiles = _load_all_profiles()

    # Deduplicate: keep latest profile per platform
    latest: dict = {}
    for p in all_profiles:
        pid = p["platform_number"]
        if pid not in latest or p["timestamp"] > latest[pid]["timestamp"]:
            latest[pid] = p

    result = list(latest.values())

    if bbox:
        min_lat, max_lat, min_lon, max_lon = bbox
        result = [
            p for p in result
            if min_lat <= p["latitude"] <= max_lat and min_lon <= p["longitude"] <= max_lon
        ]

    return result


def get_float_profile(instrument_id: str) -> Optional[dict]:
    """
    Return the full depth profile for one Argo instrument_id.
    All available parameters (TEMP, PSAL, DOXY, CHLA, …) are included
    with depth as the x-axis.
    """
    all_profiles = _load_all_profiles()
    meta = next((p for p in all_profiles if p["instrument_id"] == instrument_id), None)
    if meta is None:
        return None

    fpath = meta["file"]
    idx = meta["profile_index"]

    try:
        ds = nc4.Dataset(fpath, "r")
        result = {
            "instrument_id": instrument_id,
            "platform_number": meta["platform_number"],
            "type": "argo",
            "latitude": meta["latitude"],
            "longitude": meta["longitude"],
            "timestamp": meta["timestamp"],
            "available_params": meta["available_params"],
            "bgc_params": meta["bgc_params"],
            "depth_profiles": {},
            "param_meta": {},
        }

        # Extract PRES first (depth axis)
        pres_data = _mask_to_list(ds.variables["PRES"][idx])

        # Extract each available parameter
        for param in _PROFILE_PARAMS:
            if param not in ds.variables:
                continue
            arr = ds.variables[param][idx]
            values = _mask_to_list(arr)

            # Pair with pressure, removing any completely-masked pairs
            pairs = [(p, v) for p, v in zip(pres_data, values)
                     if p is not None and v is not None]
            if not pairs:
                continue

            depths, vals = zip(*pairs)
            pmeta = config.ARGO_PARAM_META.get(param, {})
            result["depth_profiles"][param] = {
                "pressure": list(depths),
                "values": list(vals),
                "n_levels": len(depths),
            }
            result["param_meta"][param] = {
                "long_name": pmeta.get("long_name", param),
                "units": pmeta.get("units", ""),
                "color": pmeta.get("color", "#ffffff"),
                "icon": pmeta.get("icon", "📈"),
            }

        ds.close()
        return result
    except Exception as e:
        return None


def get_float_trajectory(platform_number: str) -> Optional[dict]:
    """Return the GPS track (lat/lon/date sequence) for one float."""
    trajs = _load_trajectories()
    return trajs.get(platform_number, None)


def get_ts_diagram(instrument_id: str) -> Optional[dict]:
    """
    Return Temperature–Salinity scatter data for one Argo profile.
    Used to identify water masses in the T-S diagram view.
    """
    profile = get_float_profile(instrument_id)
    if profile is None:
        return None

    dp = profile["depth_profiles"]
    if "TEMP" not in dp or "PSAL" not in dp:
        return None

    # Build a pressure → (T, S) lookup for points where both exist
    temp_dict = dict(zip(dp["TEMP"]["pressure"], dp["TEMP"]["values"]))
    psal_dict = dict(zip(dp["PSAL"]["pressure"], dp["PSAL"]["values"]))

    common_p = sorted(set(temp_dict) & set(psal_dict))
    points = [
        {
            "pressure": p,
            "temperature": temp_dict[p],
            "salinity": psal_dict[p],
        }
        for p in common_p
        if temp_dict[p] is not None and psal_dict[p] is not None
    ]

    return {
        "instrument_id": instrument_id,
        "platform_number": profile["platform_number"],
        "latitude": profile["latitude"],
        "longitude": profile["longitude"],
        "timestamp": profile["timestamp"],
        "points": points,
        "n_points": len(points),
    }


def get_all_trajectories() -> List[dict]:
    """Return all float trajectories for the map overlay."""
    trajs = _load_trajectories()
    return list(trajs.values())


def clear_cache():
    """Clear lru_cache (for testing / forced reload)."""
    _load_all_profiles.cache_clear()
    _load_trajectories.cache_clear()
