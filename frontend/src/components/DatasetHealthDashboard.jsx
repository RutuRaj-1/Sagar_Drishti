// DatasetHealthDashboard.jsx — SAGAR-DRISHTI
// Production-grade real-time Ocean Intelligence Platform Health & Ingestion Dashboard
import React, { useState } from "react";
import { api } from "../api";

export default function DatasetHealthDashboard({
  datasetStatus,
  onRefresh,
  loading = false,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(null);

  const handleManualSync = async (datasetId = null) => {
    try {
      setRefreshing(true);
      setRefreshNotice("Dispatching live API synchronization job...");
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "live":
        return (
          <span style={styles.badgeLive}>
            <span style={styles.liveDot}></span> Live
          </span>
        );
      case "delayed":
        return (
          <span style={styles.badgeDelayed}>
            <span style={styles.delayedDot}></span> Delayed
          </span>
        );
      case "offline":
      default:
        return (
          <span style={styles.badgeOffline}>
            <span style={styles.offlineDot}></span> Offline
          </span>
        );
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
      const diffHours = Math.floor(diffMin / 60);
      return `${diffHours}h ago`;
    } catch {
      return isoString;
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "N/A";
    return dateStr.replace("T00:00:00Z", "").replace("T", " ");
  };

  const entries = Object.entries(datasetStatus || {});

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            <span style={{ marginRight: 8 }}>🛰️</span> Real-Time Ocean Observation & Ingestion Pipeline
          </h2>
          <p style={styles.subtitle}>
            Continuous synchronization with official Copernicus Marine, Coriolis GDAC, IOOS ERDDAP, and INCOIS observational networks.
          </p>
        </div>
        <button
          style={{
            ...styles.syncButton,
            opacity: refreshing ? 0.7 : 1,
            cursor: refreshing ? "not-allowed" : "pointer",
          }}
          onClick={() => handleManualSync()}
          disabled={refreshing}
        >
          {refreshing ? "🔄 Syncing Pipeline..." : "⚡ Sync All Providers Now"}
        </button>
      </div>

      {refreshNotice && (
        <div style={styles.noticeBanner}>
          ℹ️ {refreshNotice}
        </div>
      )}

      {/* Grid of 6 Dataset Cards */}
      <div style={styles.grid}>
        {entries.map(([key, info]) => {
          const isLive = info.status === "live";
          return (
            <div key={key} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.cardTitle}>{info.name || key}</div>
                  <div style={styles.providerTag}>{info.provider || "Official Provider"}</div>
                </div>
                {getStatusBadge(info.status)}
              </div>

              <div style={styles.metricRow}>
                <div style={styles.metricBox}>
                  <div style={styles.metricLabel}>Latest Observation</div>
                  <div style={styles.metricValue}>
                    {formatDateDisplay(info.latest)}
                  </div>
                </div>
                <div style={styles.metricBox}>
                  <div style={styles.metricLabel}>Temporal Coverage</div>
                  <div style={styles.metricValueSmall}>
                    {info.coverage_start || "2022-06-01"} → {info.latest ? info.latest.slice(0, 10) : "Latest"}
                  </div>
                </div>
              </div>

              <div style={styles.detailsList}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Refresh Cadence:</span>
                  <span style={styles.detailVal}>{info.refresh_interval || "Hourly"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Active Records:</span>
                  <span style={styles.detailVal}>
                    {info.records
                      ? info.records.toLocaleString()
                      : info.stations
                      ? `${info.stations} Stations`
                      : info.buoys
                      ? `${info.buoys} Moorings`
                      : "Active"}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Last Sync:</span>
                  <span style={styles.detailVal}>
                    {formatRelativeTime(info.last_updated_utc)}
                  </span>
                </div>
              </div>

              {info.message && (
                <div style={styles.statusMessage}>
                  {info.message}
                </div>
              )}

              <div style={styles.cardFooter}>
                <button
                  style={styles.cardSyncBtn}
                  onClick={() => handleManualSync(key)}
                  disabled={refreshing}
                >
                  Sync Dataset
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
    color: "#ecf0f1",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px",
    background: "rgba(16, 26, 43, 0.75)",
    backdropFilter: "blur(12px)",
    padding: "16px 24px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: "1.3rem",
    fontWeight: "600",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
  },
  subtitle: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
  syncButton: {
    background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
    color: "#ffffff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "0.85rem",
    boxShadow: "0 4px 14px rgba(14, 165, 233, 0.3)",
    transition: "all 0.2s ease",
  },
  noticeBanner: {
    background: "rgba(14, 165, 233, 0.15)",
    border: "1px solid rgba(14, 165, 233, 0.4)",
    padding: "10px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "0.85rem",
    color: "#38bdf8",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    transition: "transform 0.2s ease, border-color 0.2s ease",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },
  cardTitle: {
    fontSize: "1.05rem",
    fontWeight: "600",
    color: "#f8fafc",
  },
  providerTag: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "2px",
  },
  badgeLive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(16, 185, 129, 0.15)",
    color: "#34d399",
    border: "1px solid rgba(52, 211, 153, 0.4)",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px #10b981",
  },
  badgeDelayed: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(245, 158, 11, 0.15)",
    color: "#fbbf24",
    border: "1px solid rgba(251, 191, 36, 0.4)",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  delayedDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#f59e0b",
    boxShadow: "0 0 8px #f59e0b",
  },
  badgeOffline: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
    border: "1px solid rgba(248, 113, 113, 0.4)",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  offlineDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#ef4444",
    boxShadow: "0 0 8px #ef4444",
  },
  metricRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  metricBox: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "8px",
    padding: "10px 12px",
  },
  metricLabel: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  metricValue: {
    fontSize: "0.92rem",
    fontWeight: "600",
    color: "#38bdf8",
    fontFamily: "monospace",
  },
  metricValueSmall: {
    fontSize: "0.8rem",
    fontWeight: "500",
    color: "#e2e8f0",
    fontFamily: "monospace",
  },
  detailsList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "0.82rem",
    background: "rgba(0, 0, 0, 0.2)",
    padding: "10px 12px",
    borderRadius: "8px",
  },
  detailItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    color: "#94a3b8",
  },
  detailVal: {
    color: "#f1f5f9",
    fontWeight: "500",
  },
  statusMessage: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    lineHeight: "1.4",
    fontStyle: "italic",
    borderLeft: "2px solid #0284c7",
    paddingLeft: "8px",
  },
  cardFooter: {
    marginTop: "auto",
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "6px",
  },
  cardSyncBtn: {
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#cbd5e1",
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
