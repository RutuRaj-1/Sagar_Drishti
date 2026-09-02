"""
main.py
-------
SAGAR-DRISHTI — सागर-दृष्टि ("Ocean Vision")
FastAPI entrypoint for the SIH 26067 backend.

Implements FR-API endpoints defined in SRS §3.4 and powers the
SAGAR-DRISHTI 3D Ocean Data Visualization & Analytics Platform.

Run:
    uvicorn app.main:app --reload --port 8000

Docs (auto-generated Swagger):
    http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import variables, model, instruments, analytics, volumetric, gliders

app = FastAPI(
    title="SAGAR-DRISHTI Ocean Analytics API",
    description=(
        "सागर-दृष्टि ('Ocean Vision') — REST API for the SAGAR-DRISHTI 3D Ocean Data "
        "Visualization & Analytics Platform (SIH 26067, INCOIS). "
        "Serves real Copernicus Marine Ocean Dataset (2022–2026, Bay of Bengal + Arabian Sea) "
        "surface slices, 4D volumetric depth slices, current vectors, time series, spatial statistics, "
        "anomaly fields, and Argo/Glider instrument profiles to the browser-native WebGL frontend."
    ),
    version="2.0.0",
    contact={"name": "SAGAR-DRISHTI Team", "url": "https://incois.gov.in"},
    license_info={"name": "Data: E.U. Copernicus Marine Service (CMEMS)"},
)

# NFR §3.3.4: wide-open CORS for hackathon demo — restrict in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(variables.router)
app.include_router(model.router)
app.include_router(volumetric.router)
app.include_router(instruments.router)
app.include_router(gliders.router)
app.include_router(analytics.router)


@app.get("/api/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "service": "sagar-drishti-api",
        "version": "2.0.0",
        "dataset": "Copernicus Marine — cmems_mod_glo_phy_anfc_merged-uv_PT1H-i",
        "domain": "Bay of Bengal + Arabian Sea (5°N–22°N, 68°E–95°E)",
        "time_range": "2022-06-01 to 2026-09-09",
    }


@app.get("/", tags=["health"])
def root():
    return {
        "name": "SAGAR-DRISHTI",
        "tagline": "सागर-दृष्टि — Ocean Vision",
        "description": "Browser-native 3D Ocean Data Visualization & Analytics — SIH 26067 / INCOIS",
        "docs": "/docs",
        "endpoints": {
            "variables": "GET /api/variables",
            "dates": "GET /api/variables/dates",
            "surface": "GET /api/model/surface?variable=tob&date=2024-01-01&downsample=4",
            "timeseries": "GET /api/model/timeseries?variable=tob&lat=15&lon=80",
            "stats": "GET /api/model/stats?variable=tob&date=2024-01-01",
            "anomaly": "GET /api/model/anomaly?variable=tob&date=2024-01-01&downsample=4",
            "instruments": "GET /api/instruments",
            "profile": "GET /api/instruments/{id}/profile?compare_variable=tob",
            "trend": "GET /api/analytics/trend?variable=tob&lat=15&lon=80",
            "correlation": "GET /api/analytics/correlation?var1=tob&var2=mlotst&lat=15&lon=80",
            "region_stats": "GET /api/analytics/region_stats?variable=tob&date=2024-01-01",
        },
    }
