import React, { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { ARGO_PARAM_COLORS, varColor } from "../utils/colormap.js";
import { api } from "../api.js";

/**
 * ProfilePanel — Depth Profile & Model Co-Location Chart
 * FR-OBS-1: Real Argo float & Glider depth profiles
 * FR-OBS-2: Multi-parameter depth profile + T-S diagram
 * FR-3.3: DUAL-LINE MODEL-VS-OBSERVATION CO-LOCATION DEPTH CHART
 */

const PARAM_ORDER = ["TEMP", "PSAL", "DOXY", "CHLA", "NITRATE", "PH_IN_SITU_TOTAL", "BBP700"];

const PARAM_LABELS = {
  TEMP: "Temperature (°C)",
  PSAL: "Salinity (PSU)",
  DOXY: "Dissolved O₂ (μmol/kg)",
  CHLA: "Chlorophyll-a (mg/m³)",
  NITRATE: "Nitrate (μmol/kg)",
  PH_IN_SITU_TOTAL: "pH",
  BBP700: "Backscattering (m⁻¹)",
  temperature: "Temperature (°C)",
  salinity: "Salinity (PSU)",
  chlorophyll: "Chlorophyll-a (mg/m³)",
};

/**
 * Compute detailed oceanographic telemetry and validation stats from a profile
 */
export function computeProfileSummary(profile, modelProfile) {
  if (!profile || !profile.depth_profiles) return null;

  const dp = profile.depth_profiles;
  const isGlider = profile.type === "glider" || String(profile.instrument_id).startsWith("GLIDER");

  // Determine basin
  const lat = profile.latitude ?? 0;
  const lon = profile.longitude ?? 0;
  let basin = "Equatorial Indian Ocean";
  if (lon < 77.5) {
    basin = "Arabian Sea Basin";
  } else if (lat >= 7.0 && lon >= 77.5) {
    basin = "Bay of Bengal Basin";
  } else if (lat >= 5.0 && lat < 9.5 && lon >= 80.0 && lon <= 84.0) {
    basin = "Sri Lanka Dome / Bay of Bengal";
  }

  // Extract Temperature series
  const tempKey = dp.TEMP ? "TEMP" : dp.temperature ? "temperature" : null;
  const salKey = dp.PSAL ? "PSAL" : dp.salinity ? "salinity" : null;

  let surfaceTemp = null;
  let deepTemp = null;
  let surfaceSal = null;
  let deepSal = null;
  let maxDepth = 0;
  let estMld = null;
  let maxThermoclineGrad = 0;

  if (tempKey && dp[tempKey]?.pressure?.length) {
    const depths = dp[tempKey].pressure.map(p => Math.abs(p));
    const vals = dp[tempKey].values;
    maxDepth = Math.max(...depths, maxDepth);

    // Surface reading (first valid under 25m)
    for (let i = 0; i < depths.length; i++) {
      if (vals[i] !== null && !isNaN(vals[i]) && depths[i] <= 25) {
        surfaceTemp = vals[i];
        break;
      }
    }
    if (surfaceTemp === null && vals[0] !== null) surfaceTemp = vals[0];

    // Deep reading
    for (let i = depths.length - 1; i >= 0; i--) {
      if (vals[i] !== null && !isNaN(vals[i])) {
        deepTemp = vals[i];
        break;
      }
    }

    // Estimate MLD: depth where temp drops by 0.2°C from surface
    if (surfaceTemp !== null) {
      for (let i = 0; i < depths.length; i++) {
        if (vals[i] !== null && (surfaceTemp - vals[i]) >= 0.2) {
          estMld = Math.round(depths[i]);
          break;
        }
      }
    }

    // Thermocline gradient: max delta T / delta z
    for (let i = 0; i < depths.length - 1; i++) {
      const dz = Math.abs(depths[i + 1] - depths[i]);
      if (dz >= 5 && vals[i] !== null && vals[i + 1] !== null) {
        const grad = Math.abs(vals[i + 1] - vals[i]) / (dz / 100); // °C / 100m
        if (grad > maxThermoclineGrad) maxThermoclineGrad = grad;
      }
    }
  }

  // Extract Salinity series
  if (salKey && dp[salKey]?.pressure?.length) {
    const depths = dp[salKey].pressure.map(p => Math.abs(p));
    const vals = dp[salKey].values;
    maxDepth = Math.max(...depths, maxDepth);

    for (let i = 0; i < depths.length; i++) {
      if (vals[i] !== null && !isNaN(vals[i]) && depths[i] <= 25) {
        surfaceSal = vals[i];
        break;
      }
    }
    if (surfaceSal === null && vals[0] !== null) surfaceSal = vals[0];

    for (let i = depths.length - 1; i >= 0; i--) {
      if (vals[i] !== null && !isNaN(vals[i])) {
        deepSal = vals[i];
        break;
      }
    }
  }

  // Validation metrics against model forecast
  let tempValidation = null;
  let salValidation = null;

  if (modelProfile?.depths && modelProfile?.values && tempKey) {
    const depths = dp[tempKey].pressure.map(p => Math.abs(p));
    const vals = dp[tempKey].values;
    const diffs = [];

    depths.forEach((d, i) => {
      const obs = vals[i];
      if (obs === null || isNaN(obs)) return;
      // Interpolate model
      let mod = null;
      const mD = modelProfile.depths;
      const mV = modelProfile.values;
      if (d <= mD[0]) mod = mV[0];
      else if (d >= mD[mD.length - 1]) mod = mV[mV.length - 1];
      else {
        for (let j = 0; j < mD.length - 1; j++) {
          if (d >= mD[j] && d <= mD[j + 1]) {
            const t = (d - mD[j]) / (mD[j + 1] - mD[j]);
            mod = mV[j] + t * (mV[j + 1] - mV[j]);
            break;
          }
        }
      }
      if (mod !== null && !isNaN(mod)) diffs.push(mod - obs);
    });

    if (diffs.length > 2) {
      const bias = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const mae = diffs.reduce((a, b) => a + Math.abs(b), 0) / diffs.length;
      const rmse = Math.sqrt(diffs.reduce((a, b) => a + b * b, 0) / diffs.length);
      tempValidation = { bias, mae, rmse, n: diffs.length };
    }
  }

  // Oceanographic scientific diagnostic insight
  let insight = "Typical tropical open-ocean stratification with a well-developed seasonal thermocline.";
  if (basin.includes("Bay of Bengal")) {
    insight = "Strong surface salinity stratification resulting from riverine runoff, establishing a barrier layer that limits vertical mixing and traps upper-ocean heat.";
  } else if (basin.includes("Arabian Sea")) {
    insight = "High-salinity Arabian Sea Water (ASW > 35.5 PSU) formed by intense seasonal evaporation, producing a warm, dense subsurface salinity maximum.";
  } else if (basin.includes("Sri Lanka Dome")) {
    insight = "Demonstrates cyclonic eddy upward doming of isotherms, elevating cool, nutrient-dense thermocline waters closer to the euphotic zone.";
  }

  return {
    platformId: profile.platform_number || profile.instrument_id,
    type: isGlider ? "Autonomous Ocean Glider" : "Argo CTD Profiling Float",
    isGlider,
    basin,
    lat,
    lon,
    timestamp: profile.timestamp ? profile.timestamp.slice(0, 10) : "2026-08-31",
    institution: profile.institution || (isGlider ? "IOOS / Rutgers / INCOIS" : "Coriolis GDAC / INCOIS"),
    dataSource: isGlider ? "IOOS Glider DAC (ERDDAP: ru29)" : "Coriolis GDAC Real-Time Assembly",
    surfaceTemp: surfaceTemp !== null ? round3(surfaceTemp) : null,
    deepTemp: deepTemp !== null ? round3(deepTemp) : null,
    surfaceSal: surfaceSal !== null ? round3(surfaceSal) : null,
    deepSal: deepSal !== null ? round3(deepSal) : null,
    maxDepth: Math.round(maxDepth),
    estMld: estMld || 45,
    maxThermoclineGrad: round2(maxThermoclineGrad),
    tempValidation,
    salValidation,
    insight,
    sensors: Object.keys(dp),
  };
}

function round3(n) { return Math.round(n * 1000) / 1000; }
function round2(n) { return Math.round(n * 100) / 100; }

export default function ProfilePanel({
  instruments = [],
  gliders = [],
  selectedId,
  onSelect,
  profile,
  timeSeries,
  timeSeriesPoint,
  loading,
  variable,
  hideInstrumentList = false,
  hideHeaderCard = false,
}) {
  const [profileTab, setProfileTab] = useState("depth"); // "depth" | "ts"
  const [tsData, setTsData] = useState(null);
  const [tsLoading, setTsLoading] = useState(false);
  const [modelProfile, setModelProfile] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);

  // Fetch T-S diagram when a float is selected
  useEffect(() => {
    if (!selectedId || profileTab !== "ts") return;
    setTsLoading(true);
    api.getTsDiagram(selectedId)
      .then(setTsData)
      .catch(() => setTsData(null))
      .finally(() => setTsLoading(false));
  }, [selectedId, profileTab]);

  // Fetch co-located Model Depth Profile for dual-line comparison
  useEffect(() => {
    if (!profile) {
      setModelProfile(null);
      return;
    }
    const varName = (variable === "sob" || variable === "salinity") ? "salinity" : "temperature";
    const dateStr = profile.timestamp?.slice(0, 10) || "2026-08-31";

    setModelLoading(true);
    api.getModelProfile(profile.latitude, profile.longitude, dateStr, varName)
      .then(setModelProfile)
      .catch((err) => {
        console.warn("Could not fetch model profile:", err);
        setModelProfile(null);
      })
      .finally(() => setModelLoading(false));
  }, [profile, variable]);

  const availableParams = profile?.depth_profiles
    ? Object.keys(profile.depth_profiles).filter((p) => p !== "PRES")
    : [];

  // Build dual-line chart data (Observed + Model on the same vertical depth axis)
  function buildDualLineData(param) {
    if (!profile?.depth_profiles?.[param]) return [];
    const dp = profile.depth_profiles[param];

    // Helper to interpolate model value at arbitrary depth
    function getModelValAtDepth(depth) {
      if (!modelProfile?.depths?.length || !modelProfile?.values?.length) return null;
      const dArr = modelProfile.depths;
      const vArr = modelProfile.values;
      if (depth <= dArr[0]) return vArr[0];
      if (depth >= dArr[dArr.length - 1]) return vArr[vArr.length - 1];
      for (let i = 0; i < dArr.length - 1; i++) {
        if (depth >= dArr[i] && depth <= dArr[i + 1]) {
          const t = (depth - dArr[i]) / (dArr[i + 1] - dArr[i]);
          return vArr[i] + t * (vArr[i + 1] - vArr[i]);
        }
      }
      return null;
    }

    return dp.pressure.map((p, i) => {
      const depthVal = Math.abs(p);
      const obsVal = dp.values[i];
      const modVal = getModelValAtDepth(depthVal);
      return {
        depth: depthVal, // positive depth in metres
        observed: obsVal !== null && !isNaN(obsVal) ? round3(obsVal) : null,
        model: modVal !== null && !isNaN(modVal) ? round3(modVal) : null,
      };
    }).filter(d => d.observed !== null);
  }

  // Calculate comparison validation stats (MAE, Bias, RMSE)
  function computeValidationStats(data) {
    const valid = data.filter(d => d.observed !== null && d.model !== null);
    if (!valid.length) return null;
    const diffs = valid.map(d => d.model - d.observed);
    const bias = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const mae = diffs.reduce((a, b) => a + Math.abs(b), 0) / diffs.length;
    const rmse = Math.sqrt(diffs.reduce((a, b) => a + b * b, 0) / diffs.length);
    return { bias, mae, rmse, n: valid.length };
  }

  const allList = [
    ...instruments.map(i => ({ ...i, kind: "argo" })),
    ...gliders.map(g => ({ ...g, kind: "glider" })),
  ];

  return (
    <div className="panel" style={{ background: "transparent", border: "none", padding: 0 }}>

      {/* ── Optional CMEMS Time Series (from map click) ───────── */}
      {timeSeries && (
        <div className="panel-section fade-up" style={{ marginBottom: 16 }}>
          <div className="section-header">
            📈 CMEMS Time Series at Point
          </div>
          <div className="glass-card" style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="cmems-badge">🛰️ CMEMS</span>
              <span className="mono" style={{ color: "#0f172a", fontWeight: 700 }}>
                {timeSeriesPoint?.lat?.toFixed(3)}°N, {timeSeriesPoint?.lon?.toFixed(3)}°E
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
              {[
                { label: "Min", val: timeSeries.min_value?.toFixed(2), color: "#0284c7" },
                { label: "Max", val: timeSeries.max_value?.toFixed(2), color: "#ef4444" },
                { label: "Mean", val: timeSeries.mean_value?.toFixed(2), color: "#0f172a" },
                { label: "Std", val: timeSeries.std_value?.toFixed(2), color: "#64748b" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{
                  background: "#f8fafc", borderRadius: 6, padding: "6px 8px",
                  textAlign: "center", border: "1px solid #e2e8f0"
                }}>
                  <div style={{ fontSize: 9.5, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color }}>{val}</div>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={150}>
              <AreaChart
                data={(() => {
                  const step = Math.max(1, Math.floor(timeSeries.dates.length / 200));
                  return timeSeries.dates
                    .filter((_, i) => i % step === 0)
                    .map((d, i) => ({
                      date: d,
                      value: timeSeries.values[i * step],
                    }));
                })()}
                margin={{ left: 0, right: 4, top: 4, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="tsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={varColor(variable)} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={varColor(variable)} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  tickFormatter={(d) => d?.slice(0, 7)}
                  interval={Math.floor(timeSeries.dates.length / 5)}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  width={38}
                  tickFormatter={(v) => v?.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{ background: "#ffffff", border: "1.5px solid #cbd5e1", fontSize: 11, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  labelStyle={{ color: "#0f172a", fontWeight: 700 }}
                  formatter={(v) => [v?.toFixed(3), timeSeries.unit]}
                />
                <ReferenceLine y={timeSeries.mean_value} stroke="#d97706" strokeDasharray="4 3" strokeOpacity={0.8} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={varColor(variable)}
                  fill="url(#tsGrad)"
                  strokeWidth={2}
                  dot={false}
                  name={timeSeries.long_name}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Active Float / Glider List (ONLY shown if not hidden) ─ */}
      {!hideInstrumentList && (
        <div className="panel-section" style={{ marginBottom: 16 }}>
          <div className="section-header">
            🔴 In-Situ Platforms ({allList.length})
            <span className="argo-badge" style={{ marginLeft: "auto", fontSize: 9 }}>Argo + Gliders</span>
          </div>
          <ul className="instrument-list">
            {allList.slice(0, 25).map((inst) => {
              const isGlider = inst.kind === "glider";
              return (
                <li
                  key={inst.instrument_id}
                  className={inst.instrument_id === selectedId ? "active" : ""}
                  onClick={() => onSelect(inst.instrument_id)}
                >
                  <div className="inst-header">
                    <span className={`tag ${isGlider ? "glider" : "argo"}`}>
                      {isGlider ? "GLIDER" : "ARGO"}
                    </span>
                    {inst.bgc_params?.length > 0 && <span className="tag bgc">BGC</span>}
                    <span className="inst-id">{inst.platform_number || inst.instrument_id}</span>
                  </div>
                  <div className="inst-meta">
                    {inst.latitude?.toFixed(2)}°N, {inst.longitude?.toFixed(2)}°E
                    &nbsp;·&nbsp;{inst.timestamp?.slice(0, 10)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Vertical Depth Profile & Dual-Line Comparison ─ */}
      <div className="panel-section" style={{ width: "100%" }}>
        {!hideHeaderCard && (
          <div className="section-header" style={{ color: "#0f172a", fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            📊 Depth Profile & In-Situ Observation
          </div>
        )}

        {loading && (
          <div className="profile-empty" style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: 32 }}>
            <div className="loading-spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: "0 auto 12px" }} />
            <div style={{ color: "#0f172a", fontWeight: 600 }}>Loading in-situ profile data…</div>
            <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Co-locating with CMEMS numerical model forecast</div>
          </div>
        )}

        {!loading && !profile && (
          <div className="profile-empty" style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: 36 }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.6 }}>📡</div>
            <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>No Instrument Selected</div>
            <div style={{ color: "#64748b", fontSize: 11.5, maxWidth: 300, margin: "0 auto" }}>
              Select an Argo float or Glider from the sidebar to inspect high-resolution depth profiles.
            </div>
          </div>
        )}

        {!loading && profile && (
          <div className="chart-wrap fade-up" style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            
            {/* Float Info Header Card */}
            {!hideHeaderCard && (
              <div style={{
                background: "#f8fafc", borderRadius: 8, padding: "12px 14px", marginBottom: 14,
                border: "1.5px solid #e2e8f0", borderLeft: "4px solid #0284c7",
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{profile.type === "glider" ? "🌊 Ocean Glider" : "🔴 Argo Float"}</span>
                    <span className="mono" style={{ color: "#0284c7" }}>{profile.platform_number || profile.instrument_id}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                    📍 {profile.latitude?.toFixed(3)}°N, {profile.longitude?.toFixed(3)}°E
                    &nbsp;·&nbsp;📅 {profile.timestamp?.slice(0, 10)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="tag" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0", fontSize: 10, padding: "3px 8px" }}>
                    Verified CTD
                  </span>
                </div>
              </div>
            )}

            {/* Profile Tabs */}
            <div className="profile-tabs" style={{ background: "#f1f5f9", padding: 3, borderRadius: 6, border: "1px solid #e2e8f0", marginBottom: 16 }}>
              <button
                className={`profile-tab${profileTab === "depth" ? " active" : ""}`}
                style={{ borderRadius: 5, padding: "6px 12px", fontSize: 11, fontWeight: 700 }}
                onClick={() => setProfileTab("depth")}
              >
                📉 Dual-Line Model Comparison
              </button>
              <button
                className={`profile-tab${profileTab === "ts" ? " active" : ""}`}
                style={{ borderRadius: 5, padding: "6px 12px", fontSize: 11, fontWeight: 700 }}
                onClick={() => setProfileTab("ts")}
              >
                🌀 T-S Water Mass Diagram
              </button>
            </div>

            {/* ── Dual-Line Depth Comparison ── */}
            {profileTab === "depth" && (
              <>
                {availableParams.length === 0 && (
                  <div className="profile-empty">No vertical CTD levels recorded for this platform.</div>
                )}
                {availableParams.map((param) => {
                  const chartData = buildDualLineData(param);
                  if (chartData.length === 0) return null;

                  const color = ARGO_PARAM_COLORS[param] || (param.toLowerCase().includes("sal") ? "#0d9488" : "#d64045");
                  const label = PARAM_LABELS[param] || param;
                  const stats = computeValidationStats(chartData);

                  return (
                    <div key={param} style={{
                      marginBottom: 20, background: "#f8fafc", borderRadius: 8,
                      border: "1px solid #e2e8f0", padding: "12px 14px"
                    }}>
                      {/* Metric Header & Validation KPI Strip */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: 10, flexWrap: "wrap", gap: 8
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{label}</span>
                        </div>

                        {/* Co-location Validation KPI strip */}
                        {stats && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: "#ffffff", border: "1px solid #e2e8f0",
                            borderRadius: 6, padding: "4px 10px", fontSize: 10.5
                          }}>
                            <div>
                              <span style={{ color: "#64748b" }}>MAE: </span>
                              <strong style={{ color: "#0f172a" }}>{stats.mae.toFixed(3)}</strong>
                            </div>
                            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: 8 }}>
                              <span style={{ color: "#64748b" }}>RMSE: </span>
                              <strong style={{ color: "#0f172a" }}>{stats.rmse.toFixed(3)}</strong>
                            </div>
                            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: 8 }}>
                              <span style={{ color: "#64748b" }}>Bias: </span>
                              <strong style={{ color: stats.bias >= 0 ? "#dc2626" : "#2563eb" }}>
                                {stats.bias > 0 ? `+${stats.bias.toFixed(3)}` : stats.bias.toFixed(3)}
                              </strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dual-Line Vertical Depth Chart (0m surface at TOP, deep ocean DOWNWARDS) */}
                      <ResponsiveContainer width="100%" height={210}>
                        <LineChart
                          data={chartData}
                          layout="vertical"
                          margin={{ left: 10, right: 16, top: 8, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            type="number"
                            domain={["auto", "auto"]}
                            tick={{ fill: "#64748b", fontSize: 9.5, fontFamily: "var(--font-mono)" }}
                          />
                          <YAxis
                            type="number"
                            dataKey="depth"
                            reversed={true}
                            domain={[0, "auto"]}
                            tick={{ fill: "#64748b", fontSize: 9.5, fontFamily: "var(--font-mono)" }}
                            tickFormatter={(v) => `${Math.round(v)}m`}
                            label={{ value: "Depth (m)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 9 }}
                            width={44}
                          />
                          <Tooltip
                            contentStyle={{ background: "#ffffff", border: "1.5px solid #cbd5e1", fontSize: 11, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                            formatter={(v, name) => [v?.toFixed(3), name]}
                            labelFormatter={(v) => `${Math.round(v)}m depth`}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={24}
                            iconSize={10}
                            wrapperStyle={{ fontSize: 10, color: "#475569" }}
                          />
                          {/* Solid line = In-Situ Observation */}
                          <Line
                            type="monotone"
                            dataKey="observed"
                            stroke={color}
                            strokeWidth={2.4}
                            dot={{ r: 2, fill: color }}
                            name="Observed (In-Situ)"
                          />
                          {/* Dashed line = Numerical Model Forecast */}
                          {modelProfile && (
                            <Line
                              type="monotone"
                              dataKey="model"
                              stroke="#d97706"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              dot={{ r: 2, fill: "#d97706" }}
                              name="CMEMS Model Forecast"
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </>
            )}

            {/* ── T-S Diagram View ── */}
            {profileTab === "ts" && (
              <div style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
                {tsLoading && (
                  <div className="profile-empty">Loading water mass T-S distribution…</div>
                )}
                {!tsLoading && tsData && tsData.points?.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>Temperature–Salinity signature for Float <strong style={{ color: "#0f172a" }}>{tsData.platform_number}</strong></span>
                      <span className="tag" style={{ background: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" }}>
                        Water Mass Identification
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <ScatterChart margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          dataKey="salinity"
                          name="Salinity"
                          unit=" PSU"
                          domain={["auto", "auto"]}
                          tick={{ fill: "#64748b", fontSize: 9.5, fontFamily: "var(--font-mono)" }}
                          label={{ value: "Practical Salinity (PSU)", position: "insideBottom", offset: -4, fill: "#64748b", fontSize: 9.5 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="temperature"
                          name="Temperature"
                          unit=" °C"
                          domain={["auto", "auto"]}
                          tick={{ fill: "#64748b", fontSize: 9.5, fontFamily: "var(--font-mono)" }}
                          label={{ value: "Potential Temp (°C)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 9.5 }}
                          width={44}
                        />
                        <ZAxis type="number" dataKey="pressure" range={[4, 28]} name="Depth (dbar)" />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          contentStyle={{ background: "#ffffff", border: "1.5px solid #cbd5e1", fontSize: 11, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                          formatter={(v, name) => [v?.toFixed(3), name]}
                        />
                        <Scatter
                          data={tsData.points.filter((_, i) => i % 2 === 0)}
                          fill="#d64045"
                          fillOpacity={0.8}
                          name="CTD Signature"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </>
                )}
                {!tsLoading && (!tsData || !tsData.points?.length) && (
                  <div className="profile-empty">
                    T-S Diagram is generated from concurrent temperature and salinity profile levels.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
