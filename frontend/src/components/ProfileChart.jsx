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
 * ProfilePanel — Right sidebar
 * FR-OBS-1: Real Argo float & Glider list
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
}) {
  const [profileTab, setProfileTab] = useState("depth"); // "depth" | "ts" | "comparison"
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

    // Model depth lookup map
    const modelLookup = {};
    if (modelProfile?.depths && modelProfile?.values) {
      modelProfile.depths.forEach((d, idx) => {
        modelLookup[Math.round(d)] = modelProfile.values[idx];
      });
    }

    // Helper to interpolate model value at arbitrary depth
    function getModelValAtDepth(depth) {
      if (!modelProfile?.depths?.length) return null;
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
        pressure: -depthVal, // negative so deeper = down
        depth: depthVal,
        observed: obsVal !== null ? roundVal(obsVal) : null,
        model: modVal !== null ? roundVal(modVal) : null,
      };
    }).filter(d => d.observed !== null);
  }

  function roundVal(v) {
    return typeof v === "number" ? Math.round(v * 1000) / 1000 : v;
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
    <div className="panel">

      {/* ── CMEMS Time Series (from map click) ───────── */}
      {timeSeries && (
        <div className="panel-section fade-up">
          <div className="section-header">
            📈 CMEMS Time Series at Point
          </div>
          <div className="glass-card" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "var(--steel-500)", marginBottom: 7, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="cmems-badge">🛰️ CMEMS</span>
              <span className="mono" style={{ color: "var(--steel-700)", fontWeight: 600 }}>
                {timeSeriesPoint?.lat?.toFixed(3)}°N, {timeSeriesPoint?.lon?.toFixed(3)}°E
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginBottom: 10 }}>
              {[
                { label: "Min", val: timeSeries.min_value?.toFixed(2), color: "var(--c-ssh)" },
                { label: "Max", val: timeSeries.max_value?.toFixed(2), color: "var(--c-temp)" },
                { label: "Mean", val: timeSeries.mean_value?.toFixed(2), color: "var(--steel-800)" },
                { label: "Std", val: timeSeries.std_value?.toFixed(2), color: "var(--steel-500)" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{
                  background: "var(--steel-200)", borderRadius: "var(--radius)", padding: "6px 7px",
                  textAlign: "center", border: "2px solid var(--steel-300)"
                }}>
                  <div style={{ fontSize: 9, color: "var(--steel-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--steel-300)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--steel-500)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  tickFormatter={(d) => d?.slice(0, 7)}
                  interval={Math.floor(timeSeries.dates.length / 5)}
                />
                <YAxis
                  tick={{ fill: "var(--steel-500)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  width={38}
                  tickFormatter={(v) => v?.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{ background: "var(--steel-100)", border: "2px solid var(--steel-300)", fontSize: 10.5, borderRadius: "var(--radius)" }}
                  labelStyle={{ color: "var(--steel-700)" }}
                  formatter={(v) => [v?.toFixed(3), timeSeries.unit]}
                />
                <ReferenceLine y={timeSeries.mean_value} stroke="var(--c-chla)" strokeDasharray="4 3" strokeOpacity={0.8} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={varColor(variable)}
                  fill="url(#tsGrad)"
                  strokeWidth={1.8}
                  dot={false}
                  name={timeSeries.long_name}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Active Float / Glider List ─────────────────── */}
      <div className="panel-section">
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
                  <span className={`tag ${isGlider ? "bgc" : "argo"}`}>
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

      {/* ── Vertical Depth Profile & Dual-Line Comparison ─ */}
      <div className="panel-section">
        <div className="section-header">
          📊 Depth Profile & Validation
        </div>

        {loading && (
          <div className="profile-empty">
            <div className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 2, margin: "0 auto 10px" }} />
            Loading profile & model co-location…
          </div>
        )}

        {!loading && !profile && (
          <div className="profile-empty">
            Click an Argo float or Glider on the map to<br />inspect depth profiles with model co-location.
          </div>
        )}

        {!loading && profile && (
          <div className="chart-wrap fade-up">
            {/* Float Info Card */}
            <div style={{
              background: "var(--steel-200)", borderRadius: "var(--radius)", padding: "10px 12px", marginBottom: 10,
              border: "2px solid var(--steel-300)", borderLeft: "4px solid var(--c-chla)"
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--steel-800)" }}>
                {profile.type === "glider" ? "🌊 Glider" : "🔴 Argo Float"} {profile.platform_number || profile.instrument_id}
              </div>
              <div style={{ fontSize: 10, color: "var(--steel-500)", marginTop: 2 }}>
                {profile.latitude?.toFixed(3)}°N, {profile.longitude?.toFixed(3)}°E
                &nbsp;·&nbsp;{profile.timestamp?.slice(0, 10)}
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="profile-tabs">
              <button
                className={`profile-tab${profileTab === "depth" ? " active" : ""}`}
                onClick={() => setProfileTab("depth")}
              >
                📉 Dual-Line Comparison
              </button>
              <button
                className={`profile-tab${profileTab === "ts" ? " active" : ""}`}
                onClick={() => setProfileTab("ts")}
              >
                🌀 T-S Diagram
              </button>
            </div>

            {/* ── Dual-Line Depth Comparison ── */}
            {profileTab === "depth" && (
              <>
                {availableParams.length === 0 && (
                  <div className="profile-empty">No depth profile levels found.</div>
                )}
                {availableParams.map((param) => {
                  const chartData = buildDualLineData(param);
                  if (chartData.length === 0) return null;

                  const color = ARGO_PARAM_COLORS[param] || "#00d4f0";
                  const label = PARAM_LABELS[param] || param;
                  const stats = computeValidationStats(chartData);

                  return (
                    <div key={param} style={{ marginBottom: 16 }}>
                      {/* Metric Header */}
                      <div style={{
                        fontSize: 11, fontWeight: 700, color,
                        marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 8, height: 8, background: color, borderRadius: 2 }} />
                          {label}
                        </div>
                      </div>

                      {/* Co-location Validation KPI strip */}
                      {stats && (
                        <div style={{
                          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4,
                          background: "var(--steel-100)", border: "1px solid var(--steel-300)",
                          borderRadius: 6, padding: "5px 8px", marginBottom: 8, fontSize: 9.5
                        }}>
                          <div>
                            <span style={{ color: "var(--steel-500)" }}>MAE: </span>
                            <strong style={{ color: "var(--steel-800)" }}>{stats.mae.toFixed(3)}</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--steel-500)" }}>RMSE: </span>
                            <strong style={{ color: "var(--steel-800)" }}>{stats.rmse.toFixed(3)}</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--steel-500)" }}>Bias: </span>
                            <strong style={{ color: stats.bias >= 0 ? "#ff7675" : "#74b9ff" }}>
                              {stats.bias > 0 ? `+${stats.bias.toFixed(3)}` : stats.bias.toFixed(3)}
                            </strong>
                          </div>
                        </div>
                      )}

                      {/* Dual-Line Vertical Depth Chart */}
                      <ResponsiveContainer width="100%" height={170}>
                        <LineChart
                          data={chartData}
                          layout="vertical"
                          margin={{ left: 4, right: 10, top: 4, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--steel-300)" />
                          <XAxis
                            type="number"
                            domain={["auto", "auto"]}
                            tick={{ fill: "var(--steel-500)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                          />
                          <YAxis
                            type="number"
                            dataKey="pressure"
                            tick={{ fill: "var(--steel-500)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                            label={{ value: "dbar (depth)", angle: -90, position: "insideLeft", fill: "var(--steel-500)", fontSize: 8 }}
                            width={38}
                          />
                          <Tooltip
                            contentStyle={{ background: "var(--steel-100)", border: `2px solid ${color}44`, fontSize: 10.5, borderRadius: "var(--radius)" }}
                            formatter={(v, name) => [v?.toFixed(3), name]}
                            labelFormatter={(v) => `${Math.abs(v).toFixed(0)} dbar depth`}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={24}
                            iconSize={10}
                            wrapperStyle={{ fontSize: 9.5, color: "var(--steel-600)" }}
                          />
                          {/* Solid line = In-Situ Observation */}
                          <Line
                            type="monotone"
                            dataKey="observed"
                            stroke={color}
                            strokeWidth={2.2}
                            dot={{ r: 2, fill: color }}
                            name="Observed (In-Situ)"
                          />
                          {/* Dashed line = Numerical Model Forecast */}
                          {modelProfile && (
                            <Line
                              type="monotone"
                              dataKey="model"
                              stroke="#fdcb6e"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              dot={{ r: 2, fill: "#fdcb6e" }}
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
              <>
                {tsLoading && (
                  <div className="profile-empty">Loading T-S data…</div>
                )}
                {!tsLoading && tsData && tsData.points?.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, color: "var(--steel-500)", marginBottom: 8 }}>
                      Temperature–Salinity signature for Float <strong>{tsData.platform_number}</strong>.
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <ScatterChart margin={{ left: 4, right: 10, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--steel-300)" />
                        <XAxis
                          type="number"
                          dataKey="salinity"
                          name="Salinity"
                          unit=" PSU"
                          tick={{ fill: "var(--steel-500)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                        />
                        <YAxis
                          type="number"
                          dataKey="temperature"
                          name="Temperature"
                          unit=" °C"
                          tick={{ fill: "var(--steel-500)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                          width={38}
                        />
                        <ZAxis type="number" dataKey="pressure" range={[3, 30]} name="Pressure" />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          contentStyle={{ background: "var(--steel-100)", border: "2px solid var(--steel-300)", fontSize: 10.5 }}
                          formatter={(v, name) => [v?.toFixed(3), name]}
                        />
                        <Scatter
                          data={tsData.points.filter((_, i) => i % 3 === 0)}
                          fill={ARGO_PARAM_COLORS.TEMP}
                          fillOpacity={0.75}
                          name="T-S"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
