// api.js — SAGAR-DRISHTI
// Thin fetch wrapper around the FastAPI backend (see backend/app/routers/).
// In dev, Vite proxies "/api" → http://localhost:8000 (see vite.config.js).
//
// Data sources:
//   1. CMEMS Copernicus Marine Dataset — gridded model (NC 5.8 GB)
//   2. Real Argo Float NC files — 91 floats, Jun 2025–Aug 2026

const BASE = import.meta.env.VITE_API_BASE || "";

async function getJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`API error ${res.status} on ${path}: ${detail}`);
  }
  return res.json();
}

export const api = {
  // ── Health & dataset metadata ──────────────────────────────────────────────
  health: () => getJSON("/api/health"),
  getVariables: () => getJSON("/api/variables"),
  getDates: () => getJSON("/api/variables/dates"),

  // ── CMEMS Surface model data ───────────────────────────────────────────────
  /** 2D lat×lon surface/bottom field for one CMEMS variable and date */
  getSurface: (variable, date, downsample = 4) =>
    getJSON(`/api/model/surface?variable=${variable}&date=${date}&downsample=${downsample}`),

  /** Full CMEMS time-series (2022–2026) at nearest grid point */
  getTimeSeries: (variable, lat, lon) =>
    getJSON(`/api/model/timeseries?variable=${variable}&lat=${lat}&lon=${lon}`),

  /** CMEMS spatial statistics + histogram for one variable/date */
  getStats: (variable, date) =>
    getJSON(`/api/model/stats?variable=${variable}&date=${date}`),

  /** CMEMS anomaly field (deviation from time-mean) */
  getAnomaly: (variable, date, downsample = 4) =>
    getJSON(`/api/model/anomaly?variable=${variable}&date=${date}&downsample=${downsample}`),

  // ── Real Argo Float in-situ observations ──────────────────────────────────
  /** List all Argo floats (one marker per platform, most recent profile) */
  getInstruments: () => getJSON("/api/instruments"),

  /** Full depth profile for one Argo float (TEMP, PSAL, DOXY, CHLA, …)
   *  compareVariable = CMEMS var for model-vs-obs co-location */
  getProfile: (instrumentId, compareVariable) =>
    getJSON(
      `/api/instruments/${instrumentId}/profile` +
        (compareVariable ? `?compare_variable=${compareVariable}` : "")
    ),

  /** GPS track (lat/lon time-series) for one float platform */
  getTrajectory: (instrumentId) =>
    getJSON(`/api/instruments/${instrumentId}/trajectory`),

  /** Temperature–Salinity scatter for one Argo profile */
  getTsDiagram: (instrumentId) =>
    getJSON(`/api/instruments/${instrumentId}/tsdiagram`),

  /** All float GPS tracks (for map trajectory overlay) */
  getAllTrajectories: () =>
    getJSON("/api/instruments/trajectories/all"),

  // ── 4D Volumetric Data & Currents (Tier 1 & 2) ────────────────────────────
  /** Volumetric dataset metadata (depths, variables, dates) */
  getVolumetricMeta: () => getJSON("/api/volumetric/meta"),

  /** 2D horizontal slice at specified depth level (0m - 1000m) */
  getDepthSlice: (variable, date, depth = 0, downsample = 1) =>
    getJSON(`/api/volumetric/depth-slice?variable=${variable}&date=${date}&depth=${depth}&downsample=${downsample}`),

  /** Horizontal u/v current velocity vectors at specified depth */
  getCurrents: (date, depth = 0, downsample = 2) =>
    getJSON(`/api/volumetric/currents?date=${date}&depth=${depth}&downsample=${downsample}`),

  /** Continuous numerical model depth profile at (lat, lon) for dual-line comparison */
  getModelProfile: (lat, lon, date, variable = "temperature") =>
    getJSON(`/api/volumetric/profile?lat=${lat}&lon=${lon}&date=${date}&variable=${variable}`),

  /** 3D volumetric scalar grid for Marching Cubes isosurface */
  getIsosurfaceGrid: (variable = "temperature", date = "2026-08-31") =>
    getJSON(`/api/volumetric/isosurface?variable=${variable}&date=${date}`),

  // ── Ocean Gliders (Tier 2 Instrument) ──────────────────────────────────────
  getGliders: () => getJSON("/api/gliders"),
  getGliderProfile: (instrumentId) => getJSON(`/api/gliders/${instrumentId}/profile`),

  // ── Analytics ─────────────────────────────────────────────────────────────
  getTrend: (variable, lat, lon, window = 30) =>
    getJSON(`/api/analytics/trend?variable=${variable}&lat=${lat}&lon=${lon}&window=${window}`),

  getCorrelation: (var1, var2, lat, lon) =>
    getJSON(`/api/analytics/correlation?var1=${var1}&var2=${var2}&lat=${lat}&lon=${lon}`),

  getRegionStats: (variable, date, bbox = {}) => {
    const params = new URLSearchParams({ variable, date, ...bbox });
    return getJSON(`/api/analytics/region_stats?${params}`);
  },
};
