/**
 * forecasterData.js — SAGAR-DRISHTI Forecaster Data Registry
 * Numerical ocean model run specs, model skill baselines (MAE/RMSE),
 * guided expert workflow accelerators, and technical oceanographic Q&A.
 */

export const MODEL_RUN_METADATA = {
  model_id: "CMEMS-ANFC-GLOBAL-0.083deg-P1D-M",
  institution: "E.U. Copernicus Marine / INCOIS Ocean Modeling Group",
  system_name: "NEMO v3.6 / Mercator Ocean Global Analysis & Forecast",
  run_timestamp: "2026-09-07T00:00:00Z",
  forecast_horizon: "10 Days Daily Forecast (2022-06-01 to 2026-09-09)",
  domain_bbox: "5.0°N – 22.0°N, 68.0°E – 95.0°E (Arabian Sea & Bay of Bengal)",
  spatial_resolution: "0.083° × 0.083° (~9.2 km grid mesh)",
  vertical_levels: "30 geopotential Z-levels (1.5m to 454m depth)",
  data_assimilation: "Reduced-order SEEK Filter (Altimetry, SST, BGC-Argo CTD profiles)",
  climatology_baseline: "CMEMS 10-Year Reanalysis (2010–2020 mean)",
};

export const EXPERT_WORKFLOW_PRESETS = [
  {
    id: "wf-sst",
    title: "1. Validate SST Forecast",
    subtitle: "Cross-check surface thermal field against satellite SST & RAMA buoys",
    variable: "tob",
    datasetMode: "cmems",
    depthIndex: 0,
    viewMode: "map",
    lat: 15.0,
    lon: 85.0,
    badge: "SST Validation",
    description: "Evaluates surface thermal structure across Bay of Bengal warm pool. Focuses on co-located satellite SST bias and RAMA mooring verification.",
  },
  {
    id: "wf-heatwave",
    title: "2. Investigate Marine Heatwave",
    subtitle: "Map positive SST & SSH anomaly structures and warm eddy cores",
    variable: "zos",
    datasetMode: "cmems",
    depthIndex: 0,
    viewMode: "map",
    lat: 16.5,
    lon: 84.2,
    badge: "MHW Anomaly",
    description: "Identifies sea level height anomalies (> +0.15m) associated with anticyclonic warm-core eddies feeding marine heatwave conditions.",
  },
  {
    id: "wf-argo",
    title: "3. Cross-Validate Argo vs Model",
    subtitle: "Compare 3D volumetric model profile against active float CTD sensors",
    variable: "temperature",
    datasetMode: "volumetric",
    depthIndex: 4, // ~100m
    viewMode: "webgl",
    lat: 12.0,
    lon: 88.0,
    badge: "Argo 3D Validation",
    description: "Drives vertical profile co-location between volumetric model layers and Coriolis BGC-Argo CTD casts to evaluate thermocline depth error.",
  },
  {
    id: "wf-subsurface",
    title: "4. Subsurface Anomaly Inspection",
    subtitle: "Analyze Mixed Layer Depth (MLD) and upper ocean thermal inertia",
    variable: "mlotst",
    datasetMode: "cmems",
    depthIndex: 0,
    viewMode: "map",
    lat: 10.0,
    lon: 76.0,
    badge: "MLD & Upwelling",
    description: "Inspects mixed layer depth variation along Malabar coast upwelling zone during South-West Monsoon wind stress phase.",
  },
];

export const MODEL_SKILL_BASELINES = {
  surface: {
    temp_mae: 0.38,
    temp_rmse: 0.49,
    sal_mae: 0.22,
    sal_rmse: 0.31,
    bias: "+0.14°C (Slight warm bias)",
  },
  subsurface_200m: {
    temp_mae: 0.62,
    temp_rmse: 0.78,
    sal_mae: 0.35,
    sal_rmse: 0.46,
    bias: "-0.42°C (Thermocline sharp gradient bias)",
  },
  deep_ocean: {
    temp_mae: 0.24,
    temp_rmse: 0.31,
    sal_mae: 0.11,
    sal_rmse: 0.15,
    bias: "-0.08°C (High deep-basin stability)",
  },
  sensor_coverage: {
    argo_floats: 91,
    ocean_gliders: 4,
    hf_radar_stations: 6,
    rama_buoys: 5,
    last_telemetry_utc: "2026-09-07T08:30:00Z",
    latency_breakdown: "92% < 24h · 6% 24–48h · 2% > 48h",
  },
};

export const TECHNICAL_CHATBOT_QA = [
  {
    keywords: ["rmse", "mae", "error", "accuracy", "skill"],
    question: "What is the overall model skill and RMSE?",
    answer:
      "For surface sea temperature (tob), the 24h domain MAE is 0.38°C and RMSE is 0.49°C relative to Coriolis Argo CTD casts. Subsurface layer (0–200m) shows an RMSE of 0.78°C due to sharp thermocline gradients.",
  },
  {
    keywords: ["discrepancy", "bias", "underestimation", "overestimation"],
    question: "Why is there a model-observation discrepancy near the east coast?",
    answer:
      "Discrepancies exceeding 1.2°C off the Visakhapatnam coast stem from localized fresh river runoff from the Ganges-Brahmaputra plume. High freshwater stratification inhibits vertical mixing, which numerical models tend to slightly over-diffuse.",
  },
  {
    keywords: ["heatwave", "mhw", "anomaly", "ssh"],
    question: "How is the Marine Heatwave anomaly computed?",
    answer:
      "Spatial anomalies are derived via ΔV(x,y,t) = V(x,y,t) - μ(x,y), where μ is the 10-year CMEMS climatological pixel mean. Sea Surface Height (zos) anomalies > +0.15m correlate strongly with warm anticyclonic eddies (r = 0.84, p < 0.001).",
  },
  {
    keywords: ["geostrophic", "sivelo", "current", "velocity"],
    question: "How is surface drift velocity (sivelo) derived?",
    answer:
      "Surface drift magnitude (sivelo) is computed from sea surface height gradients via geostrophic equilibrium: u_g = -(g/f)(∂η/∂y), v_g = (g/f)(∂η/∂x), sivelo = √(u_g² + v_g²). Current speeds range from 0.01 to 1.68 m/s.",
  },
  {
    keywords: ["argo", "assimilation", "seek", "filter"],
    question: "How are Argo float observations assimilated?",
    answer:
      "The CMEMS ANFC background state assimilates satellite altimetry and daily Coriolis Argo CTD profiles via a reduced-order SEEK Kalman filter with multivariate BGC background error covariance matrix.",
  },
];
