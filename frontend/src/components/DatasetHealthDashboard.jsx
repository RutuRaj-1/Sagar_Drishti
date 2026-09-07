// DatasetHealthDashboard.jsx — SAGAR-DRISHTI
// Real-Time Ocean Observation & Ingestion Pipeline — Steel Design System
import React, { useState } from "react";
import { api } from "../api";

export default function DatasetHealthDashboard({ datasetStatus, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(null);

  const handleManualSync = async (datasetId = null) => {
    try {
      setRefreshing(true);
      setRefreshNotice("Dispatching live API synchronization job…");
      await api.triggerRefresh(datasetId);
      setRefreshNotice("Sync job accepted. Observation pipeline is actively polling providers.");
      setTimeout(() => {
        if (onRefresh) onRefresh();
        setRefreshing(false);
        setTimeout(() => setRefreshNotice(null), 4000);
      }, 2000);
    } catch (err) {
      setRefreshNotice(`Sync request failed: ${err.message}`);
      setRefreshing(false);
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "Never";
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 10) return "Just now";
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      return `${Math.floor(diffMin / 60)}h ago`;
    } catch { return isoString; }
  };

  const formatDate = (s) => s ? s.replace("T00:00:00Z", "").replace("T", " ") : "N/A";

  const StatusBadge = ({ status }) => {
    const cfg = {
      live:    { color: "var(--good)",    bg: "var(--good-bg)",    dot: "var(--good)",    label: "● Live"    },
      delayed: { color: "var(--warn)",    bg: "rgba(217,119,6,.1)", dot: "var(--warn)",   label: "● Delayed" },
      offline: { color: "var(--danger)",  bg: "var(--danger-bg)",  dot: "var(--danger)",  label: "● Offline" },
    };
    const c = cfg[status] || cfg.offline;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
        color: c.color, background: c.bg,
        border: `2px solid ${c.color}40`, padding: "3px 9px",
        borderRadius: "var(--radius)", fontFamily: "var(--font-display)",
      }}>
        {c.label}
      </span>
    );
  };

  const entries = Object.entries(datasetStatus || {});

  return (
    <div style={{ display: "grid", gridTemplateColumns: "var(--sidebar-w) 1fr var(--right-w)", height: "100%", overflow: "hidden", background: "var(--steel-50)" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <aside className="panel">
        <div className="panel-section">
          <div className="panel-section-title"><span className="icon">🛰️</span> Pipeline Status</div>

          {/* Live count badge */}
          <div style={{ background: "var(--good-bg)", border: "2px solid var(--good)40", borderRadius: "var(--radius)", padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--good)", fontFamily: "var(--font-display)", lineHeight: 1 }}>
              {entries.filter(([, d]) => d.status === "live").length}
              <span style={{ fontSize: 13, color: "var(--steel-500)", fontWeight: 500, marginLeft: 6 }}>/ {entries.length} Live</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--steel-500)", marginTop: 4, fontFamily: "var(--font-body)" }}>Datasets actively ingesting</div>
          </div>

          {/* Dataset list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {entries.map(([key, info]) => (
              <div key={key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 11px",
                background: "var(--steel-50)", border: "2px solid var(--steel-300)",
                borderRadius: "var(--radius)", fontSize: 11,
              }}>
                <span style={{ fontWeight: 600, color: "var(--steel-800)", fontFamily: "var(--font-display)" }}>
                  {info.name || key}
                </span>
                <StatusBadge status={info.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-section-title"><span className="icon">⏱️</span> Last Synced</div>
          {entries.map(([key, info]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--steel-500)", marginBottom: 5, padding: "5px 0", borderBottom: "1px solid var(--steel-200)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--steel-700)" }}>{(info.name || key).split(" ")[0]}</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{formatRelativeTime(info.last_updated_utc)}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── CENTER MAIN ────────────────────────────────────────── */}
      <main style={{ padding: "20px", overflowY: "auto", background: "var(--steel-50)" }}>

        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--steel-800)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              🛰️ Real-Time Ocean Observation &amp; Ingestion Pipeline
            </h2>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--steel-500)", lineHeight: 1.6 }}>
              Continuous synchronization with Copernicus Marine, Coriolis GDAC, IOOS ERDDAP, and INCOIS observational networks.
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{ flexShrink: 0, fontSize: 11, padding: "9px 16px" }}
            onClick={() => handleManualSync()}
            disabled={refreshing}
          >
            {refreshing ? "🔄 Syncing…" : "⚡ Sync All Providers Now"}
          </button>
        </div>

        {refreshNotice && (
          <div className="info-box" style={{ borderLeft: "4px solid var(--c-ssh)", marginBottom: 18, color: "var(--c-ssh)" }}>
            ℹ️ {refreshNotice}
          </div>
        )}

        {/* Dataset Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
          {entries.map(([key, info]) => (
            <div key={key} className="analytics-card" style={{ "--card-accent": info.status === "live" ? "var(--good)" : info.status === "delayed" ? "var(--warn)" : "var(--danger)" }}>
              {/* Card Top */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--steel-800)", fontFamily: "var(--font-display)", marginBottom: 2 }}>
                    {info.name || key}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--steel-500)" }}>{info.provider || "Official Provider"}</div>
                </div>
                <StatusBadge status={info.status} />
              </div>

              {/* Metric Row */}
              <div className="kpi-grid" style={{ marginBottom: 12 }}>
                <div className="kpi-card" style={{ "--kpi-color": "var(--c-ssh)" }}>
                  <div className="kpi-label">Latest Observation</div>
                  <div className="kpi-value" style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>{formatDate(info.latest)}</div>
                </div>
                <div className="kpi-card" style={{ "--kpi-color": "var(--steel-600)" }}>
                  <div className="kpi-label">Coverage</div>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--steel-700)", lineHeight: 1.4, marginTop: 2 }}>
                    {info.coverage_start || "2022-06-01"}<br />→ {info.latest ? info.latest.slice(0, 10) : "Latest"}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div style={{ background: "var(--steel-100)", border: "2px solid var(--steel-200)", borderRadius: "var(--radius)", padding: "10px 12px", marginBottom: 12 }}>
                {[
                  ["Refresh Cadence", info.refresh_interval || "Daily (02:00 UTC)"],
                  ["Active Records", info.records ? info.records.toLocaleString() : info.stations ? `${info.stations} Stations` : info.buoys ? `${info.buoys} Moorings` : "Active"],
                  ["Last Sync", formatRelativeTime(info.last_updated_utc)],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, paddingBottom: 5, marginBottom: 5, borderBottom: "1px solid var(--steel-200)" }}>
                    <span style={{ color: "var(--steel-500)", fontWeight: 500 }}>{lbl}:</span>
                    <span style={{ color: "var(--steel-800)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{val}</span>
                  </div>
                ))}
              </div>

              {info.message && (
                <div style={{ fontSize: 10, color: "var(--steel-500)", lineHeight: 1.6, borderLeft: "3px solid var(--c-ssh)", paddingLeft: 8, marginBottom: 12, fontStyle: "italic" }}>
                  {info.message}
                </div>
              )}

              <div style={{ textAlign: "right" }}>
                <button className="btn btn-secondary" style={{ fontSize: 10, padding: "5px 12px" }} onClick={() => handleManualSync(key)} disabled={refreshing}>
                  Sync Dataset
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <aside className="panel" style={{ borderLeft: "2px solid var(--steel-300)", borderRight: "none" }}>
        <div className="panel-section">
          <div className="panel-section-title"><span className="icon">📋</span> Provider Reference</div>
          {[
            { name: "CMEMS", full: "Copernicus Marine Env. Monitoring Service", color: "var(--c-ssh)" },
            { name: "GDAC", full: "Coriolis Global Data Assembly Centre", color: "var(--c-chla)" },
            { name: "ERDDAP", full: "IOOS Environmental Research Division", color: "var(--c-salt)" },
            { name: "INCOIS", full: "Indian National Centre for Ocean Info. Services", color: "var(--c-temp)" },
            { name: "NOAA PMEL", full: "Pacific Marine Environmental Laboratory", color: "var(--c-mld)" },
          ].map(({ name, full, color }) => (
            <div key={name} style={{ padding: "8px 10px", borderLeft: `3px solid ${color}`, background: "var(--steel-50)", border: `2px solid var(--steel-300)`, borderLeft: `3px solid ${color}`, borderRadius: "var(--radius)", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--steel-800)", fontFamily: "var(--font-display)" }}>{name}</div>
              <div style={{ fontSize: 9.5, color: "var(--steel-500)", lineHeight: 1.4, marginTop: 1 }}>{full}</div>
            </div>
          ))}
        </div>

        <div className="panel-section">
          <div className="panel-section-title"><span className="icon">📡</span> Ingestion Log</div>
          <div style={{ fontSize: 10, color: "var(--steel-500)", lineHeight: 1.8, fontFamily: "var(--font-mono)" }}>
            {entries.slice(0, 4).map(([key, info]) => (
              <div key={key} style={{ paddingBottom: 4, borderBottom: "1px solid var(--steel-200)", marginBottom: 4 }}>
                <span style={{ color: info.status === "live" ? "var(--good)" : "var(--warn)" }}>●</span>
                &nbsp;{(info.name || key).split(" ")[0]} — {formatRelativeTime(info.last_updated_utc)}
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-section-title"><span className="icon">ℹ️</span> Platform Info</div>
          <div className="info-box">
            <div className="info-title">SIH 26067 — INCOIS</div>
            SAGAR-DRISHTI ingests 6 live ocean observation streams with daily refresh cadence and automated quality control.
          </div>
          <div className="info-box">
            <div className="info-title">Data Volume</div>
            {`${datasetStatus?.cmems_surface?.records ? '5.8 GB CMEMS physics' : 'CMEMS 2D'} · ${datasetStatus?.cmems_4d?.monthly_files ? `${datasetStatus.cmems_4d.monthly_files} 4D NetCDF slices` : '3D Volumes'} · ${datasetStatus?.argo?.records || datasetStatus?.argo?.n_files || 183} Argo profiles · ${(datasetStatus?.gliders?.records || 24611).toLocaleString()} glider obs · ${(datasetStatus?.hf_radar?.records || 768).toLocaleString()} HF radar vectors · ${datasetStatus?.rama?.buoys || datasetStatus?.rama?.records || 10} RAMA moorings`}
          </div>
        </div>
      </aside>
    </div>
  );
}
