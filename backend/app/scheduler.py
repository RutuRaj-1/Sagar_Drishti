"""
scheduler.py
------------
APScheduler background scheduler for SAGAR-DRISHTI.
Coordinates periodic data refresh tasks:
  - Daily refresh for CMEMS 2D and 4D datasets (02:00 UTC)
  - Hourly refresh for Argo, Gliders, HF Radar, and RAMA buoys
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.services.data_refresh_service import DataRefreshService

logger = logging.getLogger("sagar.scheduler")

_scheduler = None


def get_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler(timezone="UTC")
    return _scheduler


def start_scheduler():
    """Register cron and interval jobs, then start the background scheduler."""
    sched = get_scheduler()
    if sched.running:
        logger.info("Scheduler already running.")
        return

    # CMEMS: daily sync at 02:00 UTC
    sched.add_job(
        DataRefreshService.refresh_cmems,
        trigger=CronTrigger(hour=2, minute=0, timezone="UTC"),
        id="cmems_daily_refresh",
        name="CMEMS Daily 2D & 4D Data Synchronization",
        replace_existing=True,
        max_instances=1
    )

    # Argo: hourly refresh
    sched.add_job(
        DataRefreshService.refresh_argo,
        trigger=IntervalTrigger(hours=1),
        id="argo_hourly_refresh",
        name="Argo Float GDAC Hourly Scan",
        replace_existing=True,
        max_instances=1
    )

    # Gliders: hourly refresh
    sched.add_job(
        DataRefreshService.refresh_gliders,
        trigger=IntervalTrigger(hours=1),
        id="gliders_hourly_refresh",
        name="IOOS Glider DAC Hourly Scan",
        replace_existing=True,
        max_instances=1
    )

    # HF Radar: hourly refresh
    sched.add_job(
        DataRefreshService.refresh_hf_radar,
        trigger=IntervalTrigger(hours=1),
        id="hf_radar_hourly_refresh",
        name="Coastal HF Radar Surface Currents Hourly Scan",
        replace_existing=True,
        max_instances=1
    )

    # RAMA Buoys: hourly refresh
    sched.add_job(
        DataRefreshService.refresh_rama_buoys,
        trigger=IntervalTrigger(hours=1),
        id="rama_hourly_refresh",
        name="RAMA Moored Buoys Hourly Scan",
        replace_existing=True,
        max_instances=1
    )

    sched.start()
    logger.info("APScheduler started successfully with all ocean dataset refresh jobs.")


def stop_scheduler():
    """Safely shut down the background scheduler."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
