from app.services import netcdf_service

from fastapi import APIRouter

router = APIRouter(prefix="/api/variables", tags=["variables"])


@router.get("")
def list_variables():
    """FR-API-1: dataset metadata including all Copernicus Marine variables,
    domain extent, and full time range (2022-06-01 → 2026-09-09)."""
    return netcdf_service.get_metadata()


@router.get("/dates")
def list_dates():
    """Return the full list of available date strings (YYYY-MM-DD).
    Used by the frontend date-picker / time-slider."""
    return {"dates": netcdf_service.get_available_dates()}
