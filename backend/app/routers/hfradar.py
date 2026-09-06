"""
hfradar.py  (router)
---------------------
REST endpoints for INCOIS Coastal High-Frequency Radar surface current network.

Endpoints:
  GET /api/hfradar               – list all active coastal HF Radar stations
  GET /api/hfradar/currents      – get combined surface velocity vector grid
  GET /api/hfradar/{station_id}  – station details and local radar vectors
"""
from typing import Optional
from fastapi import APIRouter, HTTPException

from app.services import hf_radar_service

router = APIRouter(prefix="/api/hfradar", tags=["hfradar"])


@router.get("")
def list_hf_radar_stations():
    """List all coastal HF Radar stations around India."""
    return hf_radar_service.list_stations()


@router.get("/currents")
def get_coastal_currents():
    """Return high-density surface velocity vector fields across coastal HF Radar stations."""
    return hf_radar_service.get_all_coastal_vectors()


@router.get("/{station_id}")
def get_station_details(station_id: str):
    """Return local vector field and metadata for a specific HF Radar station."""
    st = hf_radar_service.get_station_vectors(station_id)
    if st is None:
        raise HTTPException(status_code=404, detail=f"HF Radar station '{station_id}' not found")
    return st
