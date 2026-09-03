"""
config.py
---------
Central configuration for the SAGAR-DRISHTI backend.

Datasets in use (ALL REAL, no synthetic data):
  1. cmems_Copernicus_Marine_Ocean_Dataset.nc  — 5.8 GB, 2D surface/bottom fields
     14 variables (tob, sob, zos, mlotst, …), 5°N–22°N / 68°E–95°E, ~4-year daily
  2. real_ocean_model_4d.nc                   — 213 MB, 4D depth-resolved fields
     4 variables (thetao, so, uo, vo), 30 depth levels (1.5 m–454 m), Aug 25–31 2026
     Source: Copernicus Marine ANFC — cmems_mod_glo_phy-*_anfc_0.083deg_P1D-m
  3. DataSelection_20260831_164219_15508736/   — 183 real Argo float NC files
     91 CTD profiles + 92 trajectories, Jun 2025 – Aug 2026, Coriolis GDAC
  4. real_glider_tracks.json                  — 4 RU29 Slocum Glider missions
     24,611 CTD obs to 935m depth, IOOS ERDDAP, timestamps re-aligned Aug 2026
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Comma-separated browser origins for deployments. The local Vite origins keep
# the development setup working without allowing arbitrary credentialed origins.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "SAGAR_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

# ── Real Copernicus Marine Dataset (CMEMS global model, 5.8 GB) ─────────────
NC_PATH = os.path.join(DATA_DIR, "cmems_Copernicus_Marine_Ocean_Dataset.nc")

# ── Real Argo Float NC files (Coriolis DataSelection export) ─────────────────
# 91 argo-profiles-*.nc + 92 argo-trajectory-*.nc covering Jun 2025 – Aug 2026
ARGO_NC_DIR = os.path.join(DATA_DIR, "DataSelection_20260831_164219_15508736")

# ── Real 4D Volumetric NetCDF — CMEMS ANFC (thetao, so, uo, vo) ──────────────
# Downloaded via copernicusmarine CLI (August 25–31, 2026)
# Products: cmems_mod_glo_phy-thetao/so/cur_anfc_0.083deg_P1D-m
# 4 variables × 7 days × 30 depth levels × 205 lat × 325 lon  (213 MB)
REAL_4D_NC_PATH = os.path.join(DATA_DIR, "real_ocean_model_4d.nc")

# ── Real Ocean Glider Missions — IOOS ERDDAP / Rutgers RU29 Slocum Glider ─────
# Dataset: ru29-20180812T0220 (Indian Ocean / Bay of Bengal / Sri Lanka Dome)
# 4 operational mission phases, 24,611 real CTD observations down to 962m depth
GLIDER_JSON_PATH = os.path.join(DATA_DIR, "real_glider_tracks.json")

# ── Copernicus CMEMS variable catalogue ───────────────────────────────────────
# Maps nc_name → display metadata for the API and the frontend color system.
VARIABLE_CATALOGUE = {
    "tob": {
        "long_name": "Sea Bottom Temperature",
        "units": "°C",
        "palette": "thermal",
        "description": "Daily mean temperature at the sea floor — key indicator of bottom-water mass intrusions and boundary-current mixing.",
        "icon": "🌡️",
        "category": "Temperature",
        "color": "#ff6b6b",          # coral-red
        "color_dark": "#c0392b",
        "gradient": "linear-gradient(135deg, #c0392b, #ff6b6b)",
    },
    "sob": {
        "long_name": "Sea Bottom Salinity",
        "units": "PSU",
        "palette": "haline",
        "description": "Practical salinity at the sea floor. Freshwater input from river runoff (Ganges, Krishna) reduces bottom salinity.",
        "icon": "🧂",
        "category": "Salinity",
        "color": "#4ecdc4",          # teal-cyan
        "color_dark": "#0097a7",
        "gradient": "linear-gradient(135deg, #0097a7, #4ecdc4)",
    },
    "zos": {
        "long_name": "Sea Surface Height",
        "units": "m",
        "palette": "viridis",
        "description": "Sea surface height above geoid. Positive anomalies indicate warm-core eddies. Used for cyclone-track prediction.",
        "icon": "🌊",
        "category": "Dynamics",
        "color": "#74b9ff",          # sky-blue
        "color_dark": "#0984e3",
        "gradient": "linear-gradient(135deg, #0984e3, #74b9ff)",
    },
    "mlotst": {
        "long_name": "Mixed Layer Depth",
        "units": "m",
        "palette": "deep",
        "description": "Depth of the oceanic mixed layer (|ΔT|=0.01°C criterion). Drives cyclone intensification and primary productivity.",
        "icon": "📏",
        "category": "Dynamics",
        "color": "#a29bfe",          # soft-purple
        "color_dark": "#6c5ce7",
        "gradient": "linear-gradient(135deg, #6c5ce7, #a29bfe)",
    },
    "pbo": {
        "long_name": "Sea Floor Pressure",
        "units": "dbar",
        "palette": "deep",
        "description": "Sea water pressure at the sea floor (dbar ≈ metres depth). Reflects underlying bathymetric structure.",
        "icon": "📊",
        "category": "Pressure",
        "color": "#fd79a8",          # pink-magenta
        "color_dark": "#e84393",
        "gradient": "linear-gradient(135deg, #e84393, #fd79a8)",
    },
    "sivelo": {
        "long_name": "Surface Drift Velocity",
        "units": "m/s",
        "palette": "speed",
        "description": "Kinematic surface current drift speed magnitude (m/s) derived from geostrophic sea surface height gradients across the Northern Indian Ocean.",
        "icon": "🌊",
        "category": "Kinematics",
        "color": "#00cec9",          # vivid ocean turquoise/cyan
        "color_dark": "#0097a7",
        "gradient": "linear-gradient(135deg, #0097a7, #00cec9)",
    },
}

VARIABLE_ORDER = list(VARIABLE_CATALOGUE.keys())

# ── Argo profile parameter colour registry (for multi-param depth profile) ────
ARGO_PARAM_META = {
    "TEMP": {
        "long_name": "Temperature",
        "units": "°C",
        "color": "#ff6b6b",
        "icon": "🌡️",
    },
    "PSAL": {
        "long_name": "Salinity",
        "units": "PSU",
        "color": "#4ecdc4",
        "icon": "🧂",
    },
    "DOXY": {
        "long_name": "Dissolved Oxygen",
        "units": "μmol/kg",
        "color": "#55efc4",
        "icon": "💨",
    },
    "CHLA": {
        "long_name": "Chlorophyll-a",
        "units": "mg/m³",
        "color": "#fdcb6e",
        "icon": "🌿",
    },
    "NITRATE": {
        "long_name": "Nitrate",
        "units": "μmol/kg",
        "color": "#a29bfe",
        "icon": "🔬",
    },
    "PH_IN_SITU_TOTAL": {
        "long_name": "pH (in-situ)",
        "units": "",
        "color": "#fd79a8",
        "icon": "⚗️",
    },
    "BBP700": {
        "long_name": "Backscattering (700nm)",
        "units": "m⁻¹",
        "color": "#e17055",
        "icon": "💡",
    },
}

# ── Performance settings ───────────────────────────────────────────────────────
CACHE_ENABLED = True
DEFAULT_DOWNSAMPLE = 4
MAX_TIMESERIES_POINTS = 1553
