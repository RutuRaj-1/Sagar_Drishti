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
 * FR-OBS-1: Real Argo float list (from Coriolis NC files)
 * FR-OBS-2: Multi-parameter depth profile + T-S diagram
 * SRS §3.6.3: CMEMS model-vs-Argo observation co-location
 */

const PARAM_ORDER = ["TEMP", "PSAL", "DOXY", "CHLA", "NITRATE", "PH_IN_SITU_TOTAL", "BBP700"];

const PARAM_LABELS = {
  TEMP: "Temp (°C)",
  PSAL: "Salinity (PSU)",
  DOXY: "O₂ (μmol/kg)",
  CHLA: "Chl-a (mg/m³)",
  NITRATE: "NO₃ (μmol/kg)",
  PH_IN_SITU_TOTAL: "pH",
  BBP700: "BBP700 (m⁻¹)",
};

export default function ProfilePanel({
  instruments,
  selectedId,
  onSelect,
  profile,
  timeSeries,
  timeSeriesPoint,
  loading,
  variable,
}) {
  const [profileTab, setProfileTab] = useState("depth"); // "depth" | "ts"
  const [tsData, setTsData] = useState(null);
  const [tsLoading, setTsLoading] = useState(false);

  // Fetch T-S diagram when a float is selected
  useEffect(() => {
    if (!selectedId || profileTab !== "ts") return;
    setTsLoading(true);
    api.getTsDiagram(selectedId)
      .then(setTsData)
      .catch(() => setTsData(null))
      .finally(() => setTsLoading(false));
  }, [selectedId, profileTab]);

  // Which depth-profile params are available for this float
  const availableParams = profile?.depth_profiles
    ? PARAM_ORDER.filter((p) => p in profile.depth_profiles && p !== "PRES")
    : [];

  // Build data for the vertical depth chart (recharts layout="vertical")
  // We use PRES (pressure ≈ depth) as the Y axis
  function buildDepthChartData(param) {
    if (!profile?.depth_profiles?.[param]) return [];
    const dp = profile.depth_profiles[param];
    return dp.pressure.map((p, i) => ({
      pressure: -Math.abs(p), // negative so deeper = down
      value: dp.values[i],
    })).filter(d => d.value !== null);
  }

  return (
    <div className="panel">

      {/* ── CMEMS Time Series (from map click) ───────── */}
      {timeSeries && (
        <div className="panel-section fade-up">
          <div className="section-header">
            📈 CMEMS Time Series at Point
          </div>
          <div className="glass-card" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 7, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="cmems-badge">🛰️ CMEMS</span>
              <span className="mono accent-text">
                {timeSeriesPoint?.lat?.toFixed(3)}°N, {timeSeriesPoint?.lon?.toFixed(3)}°E
              </span>
            </div>

            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginBottom: 10 }}>
              {[
                { label: "Min", val: timeSeries.min_value?.toFixed(2), color: "#74b9ff" },
                { label: "Max", val: timeSeries.max_value?.toFixed(2), color: "#ff6b6b" },
                { label: "Mean", val: timeSeries.mean_value?.toFixed(2), color: "var(--accent)" },
                { label: "Std", val: timeSeries.std_value?.toFixed(2), color: "var(--muted)" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{
                  background: "var(--panel-3)", borderRadius: 7, padding: "6px 7px",
                  textAlign: "center", border: "1px solid var(--border)"
                }}>
                  <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "var(--font-display)" }}>{val}</div>
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
                    <stop offset="5%" stopColor={varColor(variable)} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={varColor(variable)} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,80,130,0.18)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  tickFormatter={(d) => d?.slice(0, 7)}
                  interval={Math.floor(timeSeries.dates.length / 5)}
                />
                <YAxis
                  tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                  width={38}
                  tickFormatter={(v) => v?.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{ background: "#0b1e30", border: "1px solid var(--border-2)", fontSize: 10.5, borderRadius: 8 }}
                  labelStyle={{ color: "var(--text-2)" }}
                  formatter={(v) => [v?.toFixed(3), timeSeries.unit]}
                />
                <ReferenceLine y={timeSeries.mean_value} stroke="#f2a74b" strokeDasharray="4 3" strokeOpacity={0.7} />
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
            <div style={{ fontSize: 9, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>
              Orange dashed = long-term mean · Click map to update
            </div>
          </div>
        </div>
      )}

      {/* ── Real Argo Float List ──────────────────────── */}
      <div className="panel-section">
        <div className="section-header">
          🔴 Argo Floats ({instruments?.length ?? 0})
          <span className="argo-badge" style={{ marginLeft: "auto", fontSize: 9 }}>Real NC Data</span>
        </div>
        {(!instruments || instruments.length === 0) && (
          <div className="profile-empty">No Argo floats loaded yet.<br/>Backend loading real NC files…</div>
        )}
        <ul className="instrument-list">
          {(instruments || []).slice(0, 30).map((inst) => (
            <li
              key={inst.instrument_id}
              className={inst.instrument_id === selectedId ? "active" : ""}
              onClick={() => onSelect(inst.instrument_id)}
            >
              <div className="inst-header">
                <span className="tag argo">ARGO</span>
                {inst.bgc_params?.length > 0 && <span className="tag bgc">BGC</span>}
                <span className="inst-id">{inst.platform_number}</span>
              </div>
              <div className="inst-meta">
                {inst.latitude?.toFixed(2)}°N, {inst.longitude?.toFixed(2)}°E
                &nbsp;·&nbsp;{inst.timestamp?.slice(0, 10)}
              </div>
              {/* Param badges */}
              {inst.bgc_params?.length > 0 && (
                <div className="param-badges">
                  {inst.bgc_params.map((p) => (
                    <span key={p} className="param-badge" style={{
                      color: ARGO_PARAM_COLORS[p] || "var(--accent)",
                      borderColor: `${ARGO_PARAM_COLORS[p] || "var(--accent)"}33`,
                    }}>{p.replace("_IN_SITU_TOTAL","")}</span>
                  ))}
                </div>
              )}
            </li>
          ))}
          {instruments?.length > 30 && (
            <li style={{ textAlign: "center", color: "var(--muted)", fontSize: 10, padding: "8px", cursor: "default", border: "none" }}>
              … and {instruments.length - 30} more floats
            </li>
          )}
        </ul>
      </div>

      {/* ── Argo Depth Profile ────────────────────────── */}
      <div className="panel-section">
        <div className="section-header">📊 Argo Depth Profile</div>

        {loading && (
          <div className="profile-empty">
            <div className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 2, margin: "0 auto 10px" }} />
            Loading profile…
          </div>
        )}

        {!loading && !profile && (
          <div className="profile-empty">
            Click an Argo float in the list or map to<br />inspect its depth profile.
            <br /><br />
            <span style={{ color: "var(--accent)", fontSize: 10 }}>
              Real data: TEMP · PSAL · DOXY · CHLA · NITRATE
            </span>
          </div>
        )}

        {!loading && profile && (
          <div className="chart-wrap fade-up">
            {/* Float info header */}
            <div style={{
              background: "var(--panel-3)", borderRadius: 8, padding: "10px 12px", marginBottom: 10,
              border: "1px solid var(--border)", borderLeft: "3px solid var(--c-chla)"
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
                Float {profile.platform_number}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                {profile.latitude?.toFixed(3)}°N, {profile.longitude?.toFixed(3)}°E
                &nbsp;·&nbsp;{profile.timestamp?.slice(0, 10)}
              </div>
              {/* CMEMS model comparison badge */}
              {profile.model_comparison && (
                <div style={{
                  marginTop: 8,
                  background: "rgba(116,185,255,0.06)", border: "1px solid rgba(116,185,255,0.2)",
                  borderRadius: 6, padding: "6px 9px", fontSize: 10, color: "var(--muted)"
                }}>
                  <span className="cmems-badge" style={{ marginRight: 6 }}>🛰️ CMEMS</span>
                  {profile.model_comparison.variable?.toUpperCase()} at surface:{" "}
                  <strong style={{ color: "var(--c-ssh)", fontFamily: "var(--font-mono)" }}>
                    {profile.model_comparison.model_value?.toFixed(3) ?? "N/A"}
                  </strong>
                </div>
              )}
            </div>

            {/* Profile tabs */}
            <div className="profile-tabs">
              <button
                className={`profile-tab${profileTab === "depth" ? " active" : ""}`}
                onClick={() => setProfileTab("depth")}
              >📉 Depth Profile</button>
              <button
                className={`profile-tab${profileTab === "ts" ? " active" : ""}`}
                onClick={() => setProfileTab("ts")}
              >🌀 T-S Diagram</button>
            </div>

            {/* ── Depth Profile View ── */}
            {profileTab === "depth" && (
              <>
                {availableParams.length === 0 && (
                  <div className="profile-empty">No profile data available.</div>
                )}
                {availableParams.map((param) => {
                  const data = buildDepthChartData(param);
                  if (data.length === 0) return null;
                  const color = ARGO_PARAM_COLORS[param] || "#00d4f0";
                  const label = PARAM_LABELS[param] || param;
                  return (
                    <div key={param} style={{ marginBottom: 14 }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color,
                        fontFamily: "var(--font-body)", marginBottom: 5,
                        display: "flex", alignItems: "center", gap: 6
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
                        {label}
                      </div>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart
                          data={data}
                          layout="vertical"
                          margin={{ left: 4, right: 10, top: 4, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,80,130,0.18)" />
                          <XAxis
                            type="number"
                            tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                            domain={["auto", "auto"]}
                          />
                          <YAxis
                            type="number"
                            dataKey="pressure"
                            tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                            label={{ value: "dbar", angle: -90, position: "insideLeft", fill: "var(--muted)", fontSize: 8 }}
                            width={38}
                          />
                          <Tooltip
                            contentStyle={{ background: "#0b1e30", border: `1px solid ${color}33`, fontSize: 10.5, borderRadius: 8 }}
                            formatter={(v) => [v?.toFixed(3), label]}
                            labelFormatter={(v) => `${Math.abs(v).toFixed(0)} dbar`}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ r: 1.5, fill: color }}
                            name={label}
                          />
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
                  <div className="profile-empty">
                    <div className="loading-spinner" style={{ width: 24, height: 24, borderWidth: 2, margin: "0 auto 8px" }} />
                    Loading T-S data…
                  </div>
                )}
                {!tsLoading && !tsData && (
                  <div className="profile-empty">T-S data not available for this float.<br/>Requires both TEMP and PSAL.</div>
                )}
                {!tsLoading && tsData && tsData.points?.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8, lineHeight: 1.5 }}>
                      Temperature–Salinity diagram for float <strong style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{tsData.platform_number}</strong>.
                      Each dot is one depth level. Water mass identification: warm salty → surface; cold fresh → AAIW.
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <ScatterChart margin={{ left: 4, right: 10, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,80,130,0.18)" />
                        <XAxis
                          type="number"
                          dataKey="salinity"
                          name="Salinity"
                          unit=" PSU"
                          tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                          label={{ value: "Salinity (PSU)", position: "insideBottom", offset: -2, fill: "var(--muted)", fontSize: 9 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="temperature"
                          name="Temperature"
                          unit=" °C"
                          tick={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                          label={{ value: "Temp (°C)", angle: -90, position: "insideLeft", fill: "var(--muted)", fontSize: 9 }}
                          width={38}
                        />
                        <ZAxis type="number" dataKey="pressure" range={[3, 30]} name="Pressure" />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          contentStyle={{ background: "#0b1e30", border: "1px solid var(--border-2)", fontSize: 10.5, borderRadius: 8 }}
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
                    <div style={{ fontSize: 9, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>
                      {tsData.n_points} depth levels · size = pressure (depth)
                    </div>
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
