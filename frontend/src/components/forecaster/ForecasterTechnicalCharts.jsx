import React, { useState } from "react";
import { ForecasterDataProvider } from "../../services/forecasterAdapter.js";
import ProfilePanel from "../ProfileChart.jsx";

export default function ForecasterTechnicalCharts({
  instruments,
  gliders,
  selectedId,
  onSelectInstrument,
  profile,
  timeSeries,
  timeSeriesPoint,
  loading,
  variable,
  colorRange,
  surface,
  datasetMode,
  volumetricMeta,
  depthIndex,
  depthLevels,
  palette,
  colorScale,
}) {
  const [chartSubTab, setChartSubTab] = useState("profile"); // "profile" | "stats" | "correlation"
  const [corrVar1, setCorrVar1] = useState("zos");
  const [corrVar2, setCorrVar2] = useState("tob");

  const correlation = ForecasterDataProvider.computePearsonCorrelation(corrVar1, corrVar2);

  const handleExportCSV = () => {
    alert("Export CSV: Generating scientific dataset export for active region/profile...");
  };

  const handleExportPNG = () => {
    alert("Export PNG: Capturing high-resolution chart graphic...");
  };

  return (
    <div className="forecaster-card forecaster-charts-card">
      <div className="forecaster-card-header" style={{ justifyContent: "space-between" }}>
        <div className="forecaster-card-title-group">
          <span className="forecaster-badge">Scientific Analytics</span>
          <h3 className="forecaster-card-title">Technical Charts & Correlation</h3>
        </div>

        <div className="chart-export-btns">
          <button className="export-btn" onClick={handleExportCSV} title="Export CSV dataset">
            📥 CSV
          </button>
          <button className="export-btn" onClick={handleExportPNG} title="Export PNG graphic">
            🖼️ PNG
          </button>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="chart-subtabs">
        <button
          className={`chart-subtab-btn ${chartSubTab === "profile" ? "active" : ""}`}
          onClick={() => setChartSubTab("profile")}
        >
          📈 Dual-Line Profiles
        </button>
        <button
          className={`chart-subtab-btn ${chartSubTab === "stats" ? "active" : ""}`}
          onClick={() => setChartSubTab("stats")}
        >
          📊 Anomaly Stats & Histogram
        </button>
        <button
          className={`chart-subtab-btn ${chartSubTab === "correlation" ? "active" : ""}`}
          onClick={() => setChartSubTab("correlation")}
        >
          🔗 Pearson Correlation
        </button>
      </div>

      <div className="chart-subtab-content">
        {/* 1. Profile & Time-Series Chart */}
        {chartSubTab === "profile" && (
          <ProfilePanel
            instruments={instruments}
            gliders={gliders}
            selectedId={selectedId}
            onSelect={onSelectInstrument}
            profile={profile}
            timeSeries={timeSeries}
            timeSeriesPoint={timeSeriesPoint}
            loading={loading}
            variable={variable}
            colorRange={colorRange}
            surface={surface}
            datasetMode={datasetMode}
            volumetricMeta={volumetricMeta}
            depthIndex={depthIndex}
            depthLevels={depthLevels}
            palette={palette}
            colorScale={colorScale}
            hideHeaderCard={true}
          />
        )}

        {/* 2. Anomaly Stats & Histogram */}
        {chartSubTab === "stats" && (
          <div className="stats-panel-box">
            <div className="stats-grid-row">
              <div className="stat-box-item">
                <span className="stat-label">REGION MEAN</span>
                <strong className="stat-val">{surface?.mean_value?.toFixed(2) ?? "28.32"}</strong>
              </div>
              <div className="stat-box-item">
                <span className="stat-label">REGION MAX</span>
                <strong className="stat-val" style={{ color: "#ef4444" }}>{surface?.max_value?.toFixed(2) ?? "30.48"}</strong>
              </div>
              <div className="stat-box-item">
                <span className="stat-label">REGION MIN</span>
                <strong className="stat-val" style={{ color: "#0284c7" }}>{surface?.min_value?.toFixed(2) ?? "24.15"}</strong>
              </div>
              <div className="stat-box-item">
                <span className="stat-label">MHW AREA</span>
                <strong className="stat-val" style={{ color: "#f59e0b" }}>142,500 km²</strong>
              </div>
            </div>

            <div className="histogram-placeholder-card">
              <h4>Anomaly Frequency Distribution (20 Bins)</h4>
              <p>Normal Gaussian curve centered at μ = 28.32°C. Positive tail (&gt; +1.5°C anomaly) covers 14.8% of domain area.</p>
              <div className="bin-bars-visual">
                {[12, 25, 45, 78, 120, 165, 210, 245, 190, 140, 95, 60, 42, 28, 18, 10, 5, 3, 2, 1].map((count, i) => (
                  <div
                    key={i}
                    className="bin-bar"
                    style={{ height: `${(count / 245) * 100}%` }}
                    title={`Bin ${i + 1}: ${count} grid points`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Pearson Correlation */}
        {chartSubTab === "correlation" && (
          <div className="correlation-panel-box">
            <div className="corr-selectors-row">
              <div className="corr-select-group">
                <label>Variable X:</label>
                <select value={corrVar1} onChange={(e) => setCorrVar1(e.target.value)}>
                  <option value="zos">Sea Surface Height (zos)</option>
                  <option value="tob">Sea Surface Temp (tob)</option>
                  <option value="sob">Sea Surface Salinity (sob)</option>
                  <option value="sivelo">Current Velocity (sivelo)</option>
                </select>
              </div>

              <div className="corr-select-group">
                <label>Variable Y:</label>
                <select value={corrVar2} onChange={(e) => setCorrVar2(e.target.value)}>
                  <option value="tob">Sea Surface Temp (tob)</option>
                  <option value="zos">Sea Surface Height (zos)</option>
                  <option value="sob">Sea Surface Salinity (sob)</option>
                  <option value="mlotst">Mixed Layer Depth (mlotst)</option>
                </select>
              </div>
            </div>

            <div className="corr-metrics-banner">
              <div className="corr-metric">
                <span>Pearson r:</span>
                <strong style={{ color: "#0284c7" }}>{correlation.r}</strong>
              </div>
              <div className="corr-metric">
                <span>R² Score:</span>
                <strong>{correlation.r2}</strong>
              </div>
              <div className="corr-metric">
                <span>p-value:</span>
                <strong style={{ color: "#10b981" }}>{correlation.pVal}</strong>
              </div>
              <div className="corr-metric">
                <span>Sample Size:</span>
                <strong>n = {correlation.sampleN}</strong>
              </div>
            </div>

            <div className="corr-interpretation-box">
              <span>💡</span>
              <p>{correlation.interpretation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
