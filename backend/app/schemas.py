"""Pydantic response/request models for the SAGAR-DRISHTI API.

Covers FR-API-1 through FR-API-4 and FR-OBS-1/2.
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel


# ── Variable metadata ─────────────────────────────────────────────────────────

class VariableInfo(BaseModel):
    name: str
    long_name: str
    units: str
    palette: str
    description: str
    icon: str
    category: str
    valid_min: float
    valid_max: float
    standard_name: str


class DatasetMeta(BaseModel):
    variables: List[VariableInfo]
    lat_range: List[float]
    lon_range: List[float]
    lat_count: int
    lon_count: int
    time_start: str
    time_end: str
    time_count: int
    region: str
    source: str
    institution: str


# ── Surface slice (2D lat×lon) ─────────────────────────────────────────────────

class SurfaceSliceResponse(BaseModel):
    """FR-API-2: 2D surface / bottom field for one variable and date."""
    variable: str
    date: str
    unit: str
    lat: List[float]
    lon: List[float]
    # values[lat_i][lon_j], None for missing/masked cells
    values: List[List[Optional[float]]]
    min_value: float
    max_value: float
    mean_value: float
    downsample: int


# ── Time series ───────────────────────────────────────────────────────────────

class TimeSeriesResponse(BaseModel):
    """FR-API-3: time series at a single grid point."""
    variable: str
    long_name: str
    unit: str
    lat: float
    lon: float
    dates: List[str]
    values: List[Optional[float]]
    min_value: float
    max_value: float
    mean_value: float
    std_value: float


# ── Spatial statistics ────────────────────────────────────────────────────────

class HistogramData(BaseModel):
    counts: List[int]
    edges: List[float]


class StatsResponse(BaseModel):
    """FR-API-4: spatial statistics for one variable/date."""
    variable: str
    date: str
    unit: str
    min_value: float
    max_value: float
    mean_value: float
    std_value: float
    median_value: float
    count: int
    percentiles: Dict[str, float]
    histogram: HistogramData


# ── Anomaly ───────────────────────────────────────────────────────────────────

class AnomalyResponse(BaseModel):
    """Deviation from the long-term mean field."""
    variable: str
    date: str
    unit: str
    lat: List[float]
    lon: List[float]
    values: List[List[Optional[float]]]
    min_value: float
    max_value: float
    downsample: int


# ── Instruments ───────────────────────────────────────────────────────────────

class InstrumentSummary(BaseModel):
    instrument_id: str
    type: str
    latitude: float
    longitude: float
    timestamp: str
    status: str


class InstrumentProfile(BaseModel):
    instrument_id: str
    type: str
    latitude: float
    longitude: float
    timestamp: str
    depth_levels: List[float]
    temperature: Optional[List[float]] = None
    salinity: Optional[List[float]] = None
    chlorophyll: Optional[List[float]] = None
    model_comparison: Optional[dict] = None


# ── Analytics ─────────────────────────────────────────────────────────────────

class ColorbarConfig(BaseModel):
    palette: str = "thermal"
    min_value: float
    max_value: float
    scale: str = "linear"  # "linear" | "log"
