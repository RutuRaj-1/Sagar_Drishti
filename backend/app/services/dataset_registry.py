"""
dataset_registry.py
-------------------
Thread-safe in-memory registry maintaining the live status, coverage windows,
and operational metrics for all 6 SAGAR-DRISHTI datasets.
"""
from datetime import datetime, timezone
import threading
from typing import Dict, Any, Optional

class DatasetRegistry:
    def __init__(self):
        self._lock = threading.Lock()
        self._status: Dict[str, Dict[str, Any]] = {
            "cmems_surface": {
                "name": "CMEMS 2D Surface/Bottom Fields",
                "status": "delayed",
                "latest": None,
                "coverage_start": "2022-06-01",
                "records": 1559,
                "variables": ["tob", "sob", "zos", "mlotst", "pbo"],
                "last_updated_utc": None,
                "refresh_interval": "Daily (02:00 UTC)",
                "provider": "Copernicus Marine Environment Monitoring Service (CMEMS)",
                "message": "Initializing...",
                "next_retry": None
            },
            "cmems_4d": {
                "name": "CMEMS 4D Volumetric Ocean Fields",
                "status": "delayed",
                "latest": None,
                "coverage_start": "2022-06-01",
                "records": 7,
                "variables": ["thetao", "so", "uo", "vo"],
                "depth_levels": 30,
                "last_updated_utc": None,
                "refresh_interval": "Daily (02:00 UTC)",
                "provider": "Copernicus Marine Environment Monitoring Service (CMEMS)",
                "message": "Initializing...",
                "next_retry": None
            },
            "argo": {
                "name": "Argo Autonomous Float Network",
                "status": "delayed",
                "latest": None,
                "coverage_start": "2025-09-06",
                "records": 183,
                "variables": ["TEMP", "PSAL", "DOXY", "CHLA", "BBP700"],
                "last_updated_utc": None,
                "refresh_interval": "Hourly",
                "provider": "Coriolis Global Data Assembly Centre (GDAC)",
                "message": "Initializing...",
                "next_retry": None
            },
            "gliders": {
                "name": "Ocean Glider Deep Profiles",
                "status": "delayed",
                "latest": None,
                "coverage_start": "2025-09-06",
                "records": 24611,
                "variables": ["temperature", "salinity", "density"],
                "last_updated_utc": None,
                "refresh_interval": "Hourly",
                "provider": "IOOS ERDDAP / Rutgers Glider DAC",
                "message": "Initializing...",
                "next_retry": None
            },
            "hf_radar": {
                "name": "INCOIS Coastal HF Radar Surface Currents",
                "status": "delayed",
                "latest": None,
                "coverage_start": "2025-09-06",
                "stations": 6,
                "records": 240,
                "variables": ["u", "v", "speed", "direction_deg"],
                "last_updated_utc": None,
                "refresh_interval": "Hourly",
                "provider": "INCOIS / NIOT Coastal Radar Network",
                "message": "Initializing...",
                "next_retry": None
            },
            "rama": {
                "name": "RAMA Deep Moored Buoy Array",
                "status": "delayed",
                "latest": None,
                "coverage_start": "2025-09-06",
                "buoys": 5,
                "records": 5,
                "variables": ["sst", "sss", "wind_speed", "air_temp", "thermistor_profile"],
                "last_updated_utc": None,
                "refresh_interval": "Hourly",
                "provider": "NOAA PMEL / INCOIS Joint RAMA Array",
                "message": "Initializing...",
                "next_retry": None
            }
        }

    def update_dataset(self, dataset_id: str, updates: Dict[str, Any]):
        """Thread-safe update for a dataset status entry."""
        with self._lock:
            if dataset_id not in self._status:
                self._status[dataset_id] = {}
            self._status[dataset_id].update(updates)
            self._status[dataset_id]["last_updated_utc"] = datetime.now(timezone.utc).isoformat()

    def get_all_status(self) -> Dict[str, Any]:
        """Return snapshot of all dataset statuses."""
        with self._lock:
            return {k: dict(v) for k, v in self._status.items()}

    def get_dataset_status(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Return status for a single dataset."""
        with self._lock:
            val = self._status.get(dataset_id)
            return dict(val) if val else None

# Singleton instance
registry = DatasetRegistry()
