"""
config.py
---------
Central configuration for the SAGAR-DRISHTI backend.
Points to the real Copernicus Marine Ocean Dataset and the real Argo float
NC files from the Coriolis DataSelection export. Both datasets are used
simultaneously — CMEMS for the gridded model fields, Argo for in-situ profiles.
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# ── Real Copernicus Marine Dataset (CMEMS global model, 5.8 GB) ─────────────
NC_PATH = os.path.join(DATA_DIR, "cmems_Copernicus_Marine_Ocean_Dataset.nc")

# ── Real Argo Float NC files (Coriolis DataSelection export) ─────────────────
# 91 argo-profiles-*.nc + 92 argo-trajectory-*.nc covering Jun 2025 – Aug 2026
ARGO_NC_DIR = os.path.join(DATA_DIR, "DataSelection_20260831_164219_15508736")

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
        "long_name": "Sea Ice Speed",
        "units": "m/s",
        "palette": "ice",
        "description": "Magnitude of sea ice drift velocity. Negligible in the tropical Indian Ocean domain; included for completeness.",
        "icon": "❄️",
        "category": "Sea Ice",
        "color": "#dfe6e9",          # ice-white
        "color_dark": "#b2bec3",
        "gradient": "linear-gradient(135deg, #b2bec3, #dfe6e9)",
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
MAX_TIMESERIES_POINTS = 1562
