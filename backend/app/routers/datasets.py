"""
datasets.py
-----------
API router for dataset health status, coverage metrics, and on-demand refresh.
"""
from fastapi import APIRouter, BackgroundTasks, Query
from typing import Dict, Any, Optional

from app.services.dataset_registry import registry
from app.services.data_refresh_service import DataRefreshService

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("/status", response_model=Dict[str, Any])
def get_dataset_statuses():
    """
    Returns live operational status, latest timestamp, records count,
    coverage window, and next scheduled check for all 6 ocean datasets.
    """
    return registry.get_all_status()


@router.post("/refresh")
def trigger_refresh(
    background_tasks: BackgroundTasks,
    dataset: Optional[str] = Query(None, description="Specific dataset ID to refresh, or all if omitted")
):
    """
    Trigger an immediate asynchronous data refresh for one or all datasets.
    """
    if dataset == "cmems":
        background_tasks.add_task(DataRefreshService.refresh_cmems)
    elif dataset == "argo":
        background_tasks.add_task(DataRefreshService.refresh_argo)
    elif dataset == "gliders":
        background_tasks.add_task(DataRefreshService.refresh_gliders)
    elif dataset == "hf_radar":
        background_tasks.add_task(DataRefreshService.refresh_hf_radar)
    elif dataset == "rama":
        background_tasks.add_task(DataRefreshService.refresh_rama_buoys)
    else:
        background_tasks.add_task(DataRefreshService.refresh_all)

    return {
        "status": "accepted",
        "message": f"Data refresh scheduled for {'all datasets' if not dataset else dataset}."
    }
