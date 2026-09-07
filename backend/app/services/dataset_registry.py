"""
dataset_registry.py
-------------------
Thread-safe in-memory registry maintaining the live status, coverage windows,
and operational metrics for all 6 SAGAR-DRISHTI datasets.

Bootstraps from backend/data/metadata/registry.json on startup so the
pipeline dashboard always shows the real latest dates from disk — not
hardcoded values. When update_dataset() is called, it also writes back
to registry.json so state persists across restarts.
"""
import json
import os
from datetime import datetime, timezone
import threading
from typing import Dict, Any, Optional

REGISTRY_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "metadata", "registry.json"
)


def _read_disk_registry() -> dict:
    """Read the on-disk registry.json; returns {} on any failure."""
    try:
        if os.path.exists(REGISTRY_FILE):
            with open(REGISTRY_FILE) as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _write_disk_registry(data: dict):
    """Persist registry to disk; silently ignores write errors."""
    try:
        os.makedirs(os.path.dirname(REGISTRY_FILE), exist_ok=True)
        with open(REGISTRY_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass


class DatasetRegistry:
    def __init__(self):
        self._lock = threading.Lock()

        # ── Bootstrap from disk ──────────────────────────────────────────────
        disk = _read_disk_registry()

        def _d(key, field, fallback=None):
            """Get field from disk registry key, or fallback."""
            return disk.get(key, {}).get(field) or fallback

        now_iso = datetime.now(timezone.utc).isoformat()

        # ── Initial status dict seeded from registry.json ────────────────────
        self._status: Dict[str, Dict[str, Any]] = {
            "cmems_surface": {
                "name": "CMEMS 2D Surface/Bottom Fields",
                "provider": "Copernicus Marine Environment Monitoring Service (CMEMS)",
                "status": "live" if _d("cmems_2d_surface", "status") == "complete" else "delayed",
                "latest": _d("cmems_2d_surface", "latest"),
                "coverage_start": _d("cmems_2d_surface", "coverage_start", "2022-06-01"),
                "records": _d("cmems_2d_surface", "records", 1559),
                "variables": ["tob", "sob", "zos", "mlotst", "pbo"],
                "last_updated_utc": _d("_meta", "last_full_sync", now_iso),
                "refresh_interval": "Daily (02:00 UTC)",
                "message": "Initializing…",
                "next_retry": None,
            },
            "cmems_4d": {
                "name": "CMEMS 4D Volumetric Ocean Fields",
                "provider": "Copernicus Marine Environment Monitoring Service (CMEMS)",
                "status": "live" if _d("cmems_4d_depth", "status") in ("complete", "partial") else "delayed",
                "latest": _d("cmems_4d_depth", "latest"),
                "coverage_start": _d("cmems_4d_depth", "coverage_start", "2026-03-07"),
                "records": _d("cmems_4d_depth", "records", 7),
                "depth_levels": 30,
                "variables": ["thetao", "so", "uo", "vo"],
                "last_updated_utc": _d("_meta", "last_full_sync", now_iso),
                "refresh_interval": "Daily (02:00 UTC)",
                "message": "Initializing…",
                "next_retry": None,
            },
            "argo": {
                "name": "Argo Autonomous Float Network",
                "provider": "Coriolis Global Data Assembly Centre (GDAC)",
                "status": "live" if _d("argo", "status") == "complete" else "delayed",
                "latest": _d("argo", "latest"),
                "coverage_start": _d("argo", "coverage_start", "2025-09-07"),
                "records": _d("argo", "n_files", 183),
                "variables": ["TEMP", "PSAL", "DOXY", "CHLA", "BBP700"],
                "last_updated_utc": _d("argo", "last_sync", now_iso),
                "refresh_interval": "Hourly",
                "message": "Initializing…",
                "next_retry": None,
            },
            "gliders": {
                "name": "Ocean Glider Deep Profiles",
                "provider": "IOOS ERDDAP / Rutgers Glider DAC",
                "status": "live" if _d("gliders", "status") == "complete" else "delayed",
                "latest": _d("gliders", "latest"),
                "coverage_start": _d("gliders", "coverage_start", "2025-09-07"),
                "records": _d("gliders", "n_obs", 24611),
                "variables": ["temperature", "salinity", "density"],
                "last_updated_utc": _d("gliders", "last_sync", now_iso),
                "refresh_interval": "Hourly",
                "message": "Initializing…",
                "next_retry": None,
            },
            "hf_radar": {
                "name": "INCOIS Coastal HF Radar Surface Currents",
                "provider": "INCOIS / NIOT Coastal Radar Network",
                "status": "live" if _d("hf_radar", "status") == "complete" else "delayed",
                "latest": _d("hf_radar", "latest"),
                "coverage_start": _d("hf_radar", "coverage_start", "2025-09-07"),
                "stations": _d("hf_radar", "n_stations", 6),
                "records": _d("hf_radar", "n_vectors", 768),
                "variables": ["u", "v", "speed", "direction_deg"],
                "last_updated_utc": _d("hf_radar", "last_sync", now_iso),
                "refresh_interval": "Hourly",
                "message": "Initializing…",
                "next_retry": None,
            },
            "rama": {
                "name": "RAMA Deep Moored Buoy Array",
                "provider": "NOAA PMEL / INCOIS Joint RAMA Array",
                "status": "live" if _d("rama", "status") == "complete" else "delayed",
                "latest": _d("rama", "latest"),
                "coverage_start": _d("rama", "coverage_start", "2025-09-07"),
                "buoys": _d("rama", "n_moorings", 5),
                "records": _d("rama", "n_moorings", 5),
                "variables": ["sst", "sss", "wind_speed", "air_temp", "thermistor_profile"],
                "last_updated_utc": _d("rama", "last_sync", now_iso),
                "refresh_interval": "Hourly",
                "message": "Initializing…",
                "next_retry": None,
            },
        }

    def update_dataset(self, dataset_id: str, updates: Dict[str, Any]):
        """
        Thread-safe update for a dataset status entry.
        Also writes back to registry.json so state persists across restarts.
        """
        with self._lock:
            if dataset_id not in self._status:
                self._status[dataset_id] = {}
            self._status[dataset_id].update(updates)
            self._status[dataset_id]["last_updated_utc"] = datetime.now(timezone.utc).isoformat()

            # Mirror to disk registry key mapping
            _disk_key_map = {
                "cmems_surface": "cmems_2d_surface",
                "cmems_4d":      "cmems_4d_depth",
                "argo":          "argo",
                "gliders":       "gliders",
                "hf_radar":      "hf_radar",
                "rama":          "rama",
            }
            disk_key = _disk_key_map.get(dataset_id, dataset_id)
            disk = _read_disk_registry()
            if disk_key not in disk:
                disk[disk_key] = {}
            # Write latest, status, records into disk registry
            for field in ("latest", "status", "records", "message"):
                if field in updates:
                    disk[disk_key][field] = updates[field]
            disk[disk_key]["last_sync"] = self._status[dataset_id]["last_updated_utc"]
            disk["_meta"] = {
                "registry_version": "1.0",
                "last_full_sync": datetime.now(timezone.utc).isoformat()[:19] + "Z",
                "created_by": "SAGAR-DRISHTI dataset_registry.py",
            }
            _write_disk_registry(disk)

    def _sync_from_disk(self):
        """Re-read disk registry.json and update in-memory state dynamically."""
        disk = _read_disk_registry()
        if not disk:
            return
        mapping = {
            "cmems_surface": "cmems_2d_surface",
            "cmems_4d":      "cmems_4d_depth",
            "argo":          "argo",
            "gliders":       "gliders",
            "hf_radar":      "hf_radar",
            "rama":          "rama",
        }
        for mem_key, disk_key in mapping.items():
            if disk_key in disk:
                d_item = disk[disk_key]
                mem_item = self._status.get(mem_key, {})
                if "latest" in d_item and d_item["latest"]:
                    mem_item["latest"] = d_item["latest"]
                if "coverage_start" in d_item and d_item["coverage_start"]:
                    mem_item["coverage_start"] = d_item["coverage_start"]
                if "records" in d_item and d_item["records"] is not None:
                    mem_item["records"] = d_item["records"]
                if "status" in d_item:
                    mem_item["status"] = "live" if d_item["status"] in ("complete", "live", "partial") else d_item["status"]
                if "message" in d_item:
                    mem_item["message"] = d_item["message"]
                if "last_sync" in d_item:
                    mem_item["last_updated_utc"] = d_item["last_sync"]
                if "n_stations" in d_item:
                    mem_item["stations"] = d_item["n_stations"]
                if "n_moorings" in d_item:
                    mem_item["buoys"] = d_item["n_moorings"]
                if "monthly_files" in d_item:
                    mem_item["monthly_files"] = len(d_item["monthly_files"])
                self._status[mem_key] = mem_item

    def get_all_status(self) -> Dict[str, Any]:
        """Return snapshot of all dataset statuses with live disk updates."""
        with self._lock:
            self._sync_from_disk()
            return {k: dict(v) for k, v in self._status.items()}

    def get_dataset_status(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Return status for a single dataset with live disk updates."""
        with self._lock:
            self._sync_from_disk()
            val = self._status.get(dataset_id)
            return dict(val) if val else None


# Singleton instance — bootstrapped from disk on import
registry = DatasetRegistry()
