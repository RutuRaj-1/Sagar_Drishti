"""
buoys.py  (router)
-------------------
REST endpoints for RAMA Moored Buoy Array (INCOIS / NOAA PMEL).

Endpoints:
  GET /api/buoys                 – list all RAMA Moored Buoy locations
  GET /api/buoys/{buoy_id}/profile – depth profile & surface meteorology
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.services import rama_buoy_service

router = APIRouter(prefix="/api/buoys", tags=["buoys"])


@router.get("")
def list_buoys():
    """List all RAMA Moored Buoy stations in the Indian Ocean."""
    return rama_buoy_service.list_buoys()


@router.get("/{buoy_id}/profile")
def get_buoy_profile(
    buoy_id: str,
    compare_variable: Optional[str] = Query(None, description="CMEMS model variable to compare against buoy SST/SSS"),
):
    """Return vertical thermistor profile and meteorological measurements for a RAMA Buoy."""
    profile = rama_buoy_service.get_buoy_profile(buoy_id, compare_variable)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"RAMA Buoy '{buoy_id}' not found")
    return profile
