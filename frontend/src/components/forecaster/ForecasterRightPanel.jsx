import React, { useState } from "react";
import ForecasterSummaryCard from "./ForecasterSummaryCard.jsx";
import ForecasterAIAnalysis from "./ForecasterAIAnalysis.jsx";
import ForecasterTechnicalCharts from "./ForecasterTechnicalCharts.jsx";
import ModelSkillDashboard from "./ModelSkillDashboard.jsx";
import ExpertWorkflowBar from "./ExpertWorkflowBar.jsx";
import ForecasterChatbot from "./ForecasterChatbot.jsx";

export default function ForecasterRightPanel({
  variable,
  date,
  depthIndex,
  depthLevels,
  surfaceStats,
  palette,
  instruments,
  gliders,
  selectedId,
  onSelectInstrument,
  profile,
  timeSeries,
  timeSeriesPoint,
  loading,
  datasetMode,
  volumetricMeta,
  colorRange,
  colorScale,
  onSelectWorkflowPreset,
}) {
  const [activeTab, setActiveTab] = useState("analysis"); // "analysis" | "logbook" | "chat"
  const [activePresetId, setActivePresetId] = useState(null);
  const [bulletinDrafted, setBulletinDrafted] = useState(false);
  const [logEntries, setLogEntries] = useState([
    { time: "06:00 UTC", text: "INCOIS Watch Officer initialized 24h Bay of Bengal thermal anomaly sweep." },
    { time: "09:15 UTC", text: "Argo float WMO-2901633 CTD profile validated against Copernicus surface field." }
  ]);
  const [newLogText, setNewLogText] = useState("");

  const handlePresetClick = (preset) => {
    setActivePresetId(preset.id);
    if (onSelectWorkflowPreset) {
      onSelectWorkflowPreset(preset);
    }
  };

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!newLogText.trim()) return;
    const now = new Date().toISOString().slice(11, 16) + " UTC";
    setLogEntries([{ time: now, text: newLogText.trim() }, ...logEntries]);
    setNewLogText("");
  };

  const handleDraftBulletin = () => {
    setBulletinDrafted(true);
    setTimeout(() => setBulletinDrafted(false), 4000);
  };

  return (
    <aside className="forecaster-right-panel">
      {/* Top Header & Operational Watch Bar */}
      <div className="forecaster-panel-top">
        <div className="forecaster-panel-banner">
          <div className="forecaster-status-row">
            <span className="banner-badge forecaster-mode-tag">🔬 Duty Forecaster Mode</span>
            <span className="live-telemetry-chip">📡 Live Telemetry 100%</span>
          </div>
          <h2>Operational Decision Support</h2>
          <p>Model verification, error metrics & AI-assisted diagnostic guidance</p>
        </div>

        {/* Tactical Command Actions */}
        <div className="forecaster-quick-toolbar">
          <button
            className={`op-action-btn ${bulletinDrafted ? "success" : ""}`}
            onClick={handleDraftBulletin}
            title="Generate INCOIS Bulletin Draft"
          >
            {bulletinDrafted ? "✓ Bulletin Drafted!" : "📋 Draft Bulletin"}
          </button>
          <button
            className="op-action-btn"
            onClick={() => alert("Exporting operational netcdf anomaly contours...")}
            title="Export Anomaly GeoJSON"
          >
            ⚠️ Anomaly Export
          </button>
        </div>

        <div className="forecaster-tab-switcher">
          <button
            className={`forecaster-tab-btn ${activeTab === "analysis" ? "active" : ""}`}
            onClick={() => setActiveTab("analysis")}
          >
            📊 Diagnostics
          </button>
          <button
            className={`forecaster-tab-btn ${activeTab === "logbook" ? "active" : ""}`}
            onClick={() => setActiveTab("logbook")}
          >
            📝 Watch Logbook
          </button>
          <button
            className={`forecaster-tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            🤖 AI Co-Pilot
          </button>
        </div>
      </div>

      <div className="forecaster-panel-content">
        {activeTab === "analysis" && (
          <>
            {/* Guided Expert Workflows */}
            <ExpertWorkflowBar
              onSelectPreset={handlePresetClick}
              activePresetId={activePresetId}
            />

            {/* Technical View Summary */}
            <ForecasterSummaryCard
              variable={variable}
              date={date}
              depthIndex={depthIndex}
              depthLevels={depthLevels}
              surfaceStats={surfaceStats}
            />

            {/* AI Technical Analysis */}
            <ForecasterAIAnalysis
              variable={variable}
              date={date}
              depthIndex={depthIndex}
              depthLevels={depthLevels}
              surfaceStats={surfaceStats}
            />

            {/* Model Skill & Data Quality */}
            <ModelSkillDashboard />

            {/* Technical Charts & Pearson Correlation */}
            <ForecasterTechnicalCharts
              instruments={instruments}
              gliders={gliders}
              selectedId={selectedId}
              onSelectInstrument={onSelectInstrument}
              profile={profile}
              timeSeries={timeSeries}
              timeSeriesPoint={timeSeriesPoint}
              loading={loading}
              variable={variable}
              colorRange={colorRange}
              surface={surfaceStats}
              datasetMode={datasetMode}
              volumetricMeta={volumetricMeta}
              depthIndex={depthIndex}
              depthLevels={depthLevels}
              palette={palette}
              colorScale={colorScale}
            />
          </>
        )}

        {activeTab === "logbook" && (
          <div className="forecaster-card watch-logbook-card">
            <div className="forecaster-card-header">
              <div className="forecaster-card-icon">📝</div>
              <div className="forecaster-card-title-group">
                <span className="forecaster-badge">Duty Operations</span>
                <h3 className="forecaster-card-title">Watch Officer Logbook</h3>
              </div>
            </div>

            <form onSubmit={handleAddLog} className="log-input-form">
              <input
                type="text"
                placeholder="Log diagnostic note or anomaly flag..."
                value={newLogText}
                onChange={(e) => setNewLogText(e.target.value)}
                className="log-input"
              />
              <button type="submit" className="log-submit-btn">
                Add Log
              </button>
            </form>

            <div className="log-entries-list">
              {logEntries.map((entry, idx) => (
                <div key={idx} className="log-entry-item">
                  <span className="log-time-tag">{entry.time}</span>
                  <p className="log-entry-text">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <ForecasterChatbot variable={variable} date={date} />
        )}
      </div>

      {/* Operational Disclaimer Footer */}
      <footer className="forecaster-panel-footer">
        <p>
          <strong>SAGAR-DRISHTI Forecaster Dashboard</strong> is an operational decision support system.
          It does not replace official INCOIS watch duty procedures or marine/weather advisories.
        </p>
      </footer>
    </aside>
  );
}
