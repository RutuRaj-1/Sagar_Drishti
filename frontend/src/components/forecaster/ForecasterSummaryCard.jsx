import React, { useState } from "react";
import { ForecasterDataProvider } from "../../services/forecasterAdapter.js";

export default function ForecasterSummaryCard({
  variable,
  date,
  depthIndex,
  depthLevels,
  surfaceStats,
}) {
  const [showMetadataDrawer, setShowMetadataDrawer] = useState(false);

  const summary = ForecasterDataProvider.getTechnicalSummary({
    variable,
    date,
    depthIndex,
    depthLevels,
    surfaceStats,
  });

  return (
    <div className="forecaster-card forecaster-summary-card">
      <div className="forecaster-card-header">
        <div className="forecaster-card-icon">📡</div>
        <div className="forecaster-card-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="forecaster-badge">Operational Synopsis</span>
            <span className="utc-pill">UTC {date}</span>
          </div>
          <h3 className="forecaster-card-title">Technical View Summary</h3>
        </div>
      </div>

      <div className="technical-summary-text">
        <p>{summary.technicalHeader}</p>
      </div>

      {/* Quick Stat Pill Grid */}
      <div className="technical-stat-grid">
        <div className="tech-stat-box">
          <span className="tech-stat-label">VARIABLE</span>
          <span className="tech-stat-val">{variable.toUpperCase()}</span>
        </div>
        <div className="tech-stat-box">
          <span className="tech-stat-label">DEPTH</span>
          <span className="tech-stat-val">{summary.depthVal} m</span>
        </div>
        <div className="tech-stat-box">
          <span className="tech-stat-label">MEAN (μ)</span>
          <span className="tech-stat-val">{summary.meanVal} {summary.units}</span>
        </div>
        <div className="tech-stat-box">
          <span className="tech-stat-label">STD DEV (σ)</span>
          <span className="tech-stat-val">±{summary.stdDev}</span>
        </div>
      </div>

      <button
        className="forecaster-expand-btn"
        onClick={() => setShowMetadataDrawer(!showMetadataDrawer)}
      >
        <span>{showMetadataDrawer ? "Hide Model Run Metadata" : "View Full Model Run Metadata"}</span>
        <span>{showMetadataDrawer ? "▲" : "▼"}</span>
      </button>

      {showMetadataDrawer && (
        <div className="forecaster-metadata-drawer">
          <div className="meta-row">
            <span>Model Run ID:</span>
            <strong className="mono">{summary.modelId}</strong>
          </div>
          <div className="meta-row">
            <span>Run Timestamp:</span>
            <strong className="mono">{summary.runTimestamp}</strong>
          </div>
          <div className="meta-row">
            <span>Domain BBox:</span>
            <strong className="mono">{summary.bbox}</strong>
          </div>
          <div className="meta-row">
            <span>Spatial Resolution:</span>
            <strong className="mono">{summary.resolution}</strong>
          </div>
          <div className="meta-row">
            <span>Field Extrema:</span>
            <strong className="mono">{summary.minVal}{summary.units} to {summary.maxVal}{summary.units}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
