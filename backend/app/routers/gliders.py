"""
gliders.py
----------
REST Router for Ocean Glider missions and dive profiles.
"""
from fastapi import APIRouter, HTTPException
from app.services import glider_service

router = APIRouter(prefix="/api/gliders", tags=["gliders"])


@router.get("")
def list_gliders():
    """List all autonomous underwater gliders in the region."""
    return glider_service.list_gliders()


@router.get("/{instrument_id}/profile")
def get_glider_profile(instrument_id: str):
    """Return vertical depth profile for a glider."""
    res = glider_service.get_glider_profile(instrument_id)
    if res is None:
        raise HTTPException(status_code=404, detail=f"Glider {instrument_id} not found")
    return res
