import React, { useState } from "react";
import {
  LineChart, Line, AreaChart, Area,
  BarChart, Bar,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { api } from "../api.js";

/**
 * StatsDashboard — Analytics Tab
 * --------------------------------
 * Displays:
 *  - KPI cards (min, max, mean, std, median) from spatial stats
 *  - Histogram of variable value distribution
 *  - Trend line chart (time series + rolling mean + linear trend)
 *  - Correlation scatter plot between two variables
 *
 * All data fetched on demand via the /api/analytics/* endpoints.
 */
export default function StatsDashboard({ meta, variable, date }) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [trend, setTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendLat, setTrendLat] = useState(15.0);
  const [trendLon, setTrendLon] = useState(80.0);
  const [trendWindow, setTrendWindow] = useState(30);

  const [corr, setCorr] = useState(null);
  const [corrLoading, setCorrLoading] = useState(false);
  const [corrVar2, setCorrVar2] = useState("mlotst");

  const loadStats = () => {
    if (!meta || !variable || !date) return;
    setStatsLoading(true);
    api.getStats(variable, date)
      .then(setStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  };

  const loadTrend = () => {
    if (!variable) return;
    setTrendLoading(true);
    api.getTrend(variable, trendLat, trendLon, trendWindow)
      .then(setTrend)
      .catch(console.error)
      .finally(() => setTrendLoading(false));
  };

  const loadCorrelation = () => {
    if (!variable || !corrVar2) return;
    setCorrLoading(true);
    api.getCorrelation(variable, corrVar2, trendLat, trendLon)
      .then(setCorr)
      .catch(console.error)
      .finally(() => setCorrLoading(false));
  };

  const kpiItems = stats
    ? [
        { label: "Minimum", val: stats.min_value, color: "#00c8e0" },
        { label: "Maximum", val: stats.max_value, color: "#f25757" },
        { label: "Mean", val: stats.mean_value, color: "#00e0a0" },
        { label: "Std Dev", val: stats.std_value, color: "#f2a74b" },
        { label: "Median", val: stats.median_value, color: "#a78bfa" },
        { label: "Data Points", val: stats.count, color: "#60a5fa", noDecimals: true },
      ]
    : [];

  // Build histogram data
  const histData = stats?.histogram
    ? stats.histogram.counts.map((c, i) => ({
        bin: stats.histogram.edges[i]?.toFixed(1),
        count: c,
      }))
    : [];

  // Trend chart data (subsampled)
  const trendData = (() => {
    if (!trend) return [];
    const step = Math.max(1, Math.floor(trend.dates.length / 300));
    return trend.dates
      .filter((_, i) => i % step === 0)
      .map((d, i) => ({
        date: d.slice(0, 7),
        observed: trend.values[i * step] ?? undefined,
        smooth: trend.rolling_mean?.[i * step] ?? undefined,
        trend: trend.trend_line?.[i * step] ?? undefined,
      }));
  })();

  const slopeSign = trend?.slope_per_year > 0.001 ? "up" : trend?.slope_per_year < -0.001 ? "down" : "flat";

  return (
    <div className="analytics-layout">
      {/* ── Left config sidebar ─────────────────── */}
      <div className="analytics-sidebar">
        <div className="panel-section-title" style={{ marginBottom: 16 }}>
          <span>⚙️</span> Analytics Controls
        </div>

        {/* Stats section */}
        <div className="panel-section">
          <div className="panel-section-title"><span>📊</span> Spatial Statistics</div>
          <div className="muted-text" style={{ marginBottom: 8 }}>
            Compute stats for <strong style={{ color: "var(--accent)" }}>{variable}</strong> on {date}
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={loadStats} disabled={statsLoading}>
            {statsLoading ? "Computing…" : "Compute Stats"}
          </button>
        </div>

        <hr className="divider" />

        {/* Trend section */}
        <div className="panel-section">
          <div className="panel-section-title"><span>📈</span> Trend Analysis</div>
          <div className="field">
            <label>Latitude<span className="val">{trendLat}°N</span></label>
            <input type="number" step="0.1" min={5} max={22} value={trendLat} onChange={e => setTrendLat(parseFloat(e.target.value))} />
          </div>
          <div className="field">
            <label>Longitude<span className="val">{trendLon}°E</span></label>
            <input type="number" step="0.1" min={68} max={95} value={trendLon} onChange={e => setTrendLon(parseFloat(e.target.value))} />
          </div>
          <div className="field">
            <label>Smoothing Window<span className="val">{trendWindow} days</span></label>
            <input type="range" min={7} max={180} step={7} value={trendWindow} onChange={e => setTrendWindow(parseInt(e.target.value))} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={loadTrend} disabled={trendLoading}>
            {trendLoading ? "Fetching…" : "Compute Trend"}
          </button>
        </div>

        <hr className="divider" />

        {/* Correlation section */}
        <div className="panel-section">
          <div className="panel-section-title"><span>🔗</span> Correlation</div>
          <div className="field">
            <label>Variable A</label>
            <div style={{ padding: "7px 10px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12.5, color: "var(--accent)" }}>
              {variable}
            </div>
          </div>
          <div className="field">
            <label>Variable B</label>
            <select value={corrVar2} onChange={e => setCorrVar2(e.target.value)}>
              {(meta?.variables || []).filter(v => v.name !== variable).map(v => (
                <option key={v.name} value={v.name}>{v.long_name}</option>
              ))}
            </select>
          </div>
          <div className="muted-text" style={{ marginBottom: 8 }}>
            Using point: {trendLat}°N, {trendLon}°E
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={loadCorrelation} disabled={corrLoading}>
            {corrLoading ? "Computing…" : "Compute Correlation"}
          </button>
        </div>
      </div>

      {/* ── Main analytics area ──────────────────── */}
      <div className="analytics-main">

        {/* Empty state */}
        {!stats && !trend && !corr && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌊</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Analytics Dashboard</div>
            <div style={{ fontSize: 12, maxWidth: 360, lineHeight: 1.7 }}>
              Use the controls on the left to compute spatial statistics, temporal trends,
              and inter-variable correlations from the Copernicus Marine Ocean Dataset.
            </div>
          </div>
        )}

        {/* ── KPI Cards ──────────────────────────── */}
        {stats && (
          <div className="analytics-card fade-up" style={{ marginBottom: 16 }}>
            <div className="analytics-card-title">
              <span className="dot" /> Spatial Statistics — {stats.variable} · {stats.date}
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted)" }}>{stats.unit}</span>
            </div>
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
              {kpiItems.map(({ label, val, color, noDecimals }) => (
                <div key={label} className="kpi-card">
                  <div className="kpi-label">{label}</div>
                  <div className="kpi-value" style={{ color, fontSize: 15 }}>
                    {noDecimals ? val.toLocaleString() : val?.toFixed(3)}
                  </div>
                  {!noDecimals && <div className="kpi-unit">{stats.unit}</div>}
                </div>
              ))}
            </div>

            {/* Histogram */}
            <div className="analytics-card-title" style={{ marginTop: 12 }}>
              <span className="dot" style={{ background: "var(--warm)" }} /> Value Distribution
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={histData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis dataKey="bin" tick={{ fill: "#5a87a5", fontSize: 8 }} interval={3} />
                <YAxis tick={{ fill: "#5a87a5", fontSize: 8 }} width={30} />
                <Tooltip
                  contentStyle={{ background: "#0d2540", border: "1px solid rgba(42,100,150,0.5)", fontSize: 10, borderRadius: 7 }}
                  formatter={(v) => [v, "count"]}
                />
                <Bar dataKey="count" fill="#00c8e0" radius={[2, 2, 0, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Trend chart ──────────────────────── */}
        {trend && (
          <div className="analytics-card fade-up" style={{ marginBottom: 16 }}>
            <div className="analytics-card-title">
              <span className="dot" style={{ background: "#00e0a0" }} />
              Temporal Trend — {trend.long_name} at {trend.lat?.toFixed(2)}°N, {trend.lon?.toFixed(2)}°E
              {trend.slope_per_year != null && (
                <span className={`trend-badge trend-${slopeSign}`} style={{ marginLeft: 10 }}>
                  {slopeSign === "up" ? "↑" : slopeSign === "down" ? "↓" : "→"}&nbsp;
                  {Math.abs(trend.slope_per_year).toFixed(4)} {trend.unit}/yr
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="obsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c8e0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00c8e0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,100,150,0.2)" />
                <XAxis dataKey="date" tick={{ fill: "#5a87a5", fontSize: 9 }} interval={Math.floor(trendData.length / 6)} />
                <YAxis tick={{ fill: "#5a87a5", fontSize: 9 }} width={42} tickFormatter={v => v?.toFixed(1)} />
                <Tooltip
                  contentStyle={{ background: "#0d2540", border: "1px solid rgba(42,100,150,0.5)", fontSize: 11, borderRadius: 8 }}
                  formatter={(v, n) => [v?.toFixed(3), n]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="observed" name="Daily" stroke="#00c8e0" fill="url(#obsGrad)" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="smooth" name={`${trendWindow}d Smooth`} stroke="#00e0a0" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="trend" name="Linear Trend" stroke="#f2a74b" strokeWidth={1.5} dot={false} strokeDasharray="6 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Correlation scatter ────────────────── */}
        {corr && (
          <div className="analytics-card fade-up">
            <div className="analytics-card-title">
              <span className="dot" style={{ background: "#a78bfa" }} />
              Correlation: {corr.var1_name} vs {corr.var2_name}
              <span style={{ marginLeft: 10, padding: "2px 8px", background: "rgba(167,139,250,0.15)", borderRadius: 5, fontSize: 11, color: "#a78bfa" }}>
                r = {corr.pearson_r} &nbsp; R² = {corr.r_squared}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted)" }}>
                n = {corr.n_points} points
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,100,150,0.2)" />
                <XAxis
                  type="number" dataKey="x" name={corr.var1_name}
                  unit={` ${corr.var1_unit}`}
                  tick={{ fill: "#5a87a5", fontSize: 9 }}
                  label={{ value: `${corr.var1_name} (${corr.var1_unit})`, position: "insideBottom", offset: -4, fill: "#5a87a5", fontSize: 9 }}
                />
                <YAxis
                  type="number" dataKey="y" name={corr.var2_name}
                  unit={` ${corr.var2_unit}`}
                  tick={{ fill: "#5a87a5", fontSize: 9 }}
                  width={45}
                  label={{ value: `${corr.var2_name}`, angle: -90, position: "insideLeft", fill: "#5a87a5", fontSize: 9 }}
                />
                <Tooltip
                  contentStyle={{ background: "#0d2540", border: "1px solid rgba(42,100,150,0.5)", fontSize: 11, borderRadius: 8 }}
                  cursor={{ strokeDasharray: "3 3" }}
                />
                <Scatter data={corr.scatter} fill="#a78bfa" fillOpacity={0.6} r={2} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
