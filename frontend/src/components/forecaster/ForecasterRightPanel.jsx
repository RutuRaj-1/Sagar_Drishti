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
  const [activeTab, setActiveTab] = useState("analysis"); // "analysis" | "chat"
  const [activePresetId, setActivePresetId] = useState(null);

  const handlePresetClick = (preset) => {
    setActivePresetId(preset.id);
    if (onSelectWorkflowPreset) {
      onSelectWorkflowPreset(preset);
    }
  };

  return (
    <aside className="forecaster-right-panel">
      {/* Top Header & Tab Switcher */}
      <div className="forecaster-panel-top">
        <div className="forecaster-panel-banner">
          <div className="banner-badge">🔬 Duty Forecaster / Researcher Mode</div>
          <h2>Operational Decision Support</h2>
          <p>Model verification, error metrics & AI-assisted diagnostic guidance</p>
        </div>

        <div className="forecaster-tab-switcher">
          <button
            className={`forecaster-tab-btn ${activeTab === "analysis" ? "active" : ""}`}
            onClick={() => setActiveTab("analysis")}
          >
            📊 Forecast Diagnostics
          </button>
          <button
            className={`forecaster-tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            🤖 Technical AI Assistant
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

        {activeTab === "chat" && (
          <ForecasterChatbot variable={variable} date={date} />
        )}
      </div>

      {/* Operational Disclaimer Footer */}
      <footer className="forecaster-panel-footer">
        <p>
          <strong>SAGAR-DRISHTI Forecaster Dashboard</strong> is an operational prototype.
          It does not replace official INCOIS watch duty procedures or marine/weather advisories.
        </p>
      </footer>
    </aside>
  );
}
