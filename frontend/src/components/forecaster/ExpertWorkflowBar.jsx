import React from "react";
import { EXPERT_WORKFLOW_PRESETS } from "../../data/forecasterData.js";

export default function ExpertWorkflowBar({ onSelectPreset, activePresetId }) {
  return (
    <div className="forecaster-card expert-workflow-card">
      <div className="forecaster-card-header">
        <div className="forecaster-card-icon">[PRESET]</div>
        <div className="forecaster-card-title-group">
          <span className="forecaster-badge">Forecaster Accelerators</span>
          <h3 className="forecaster-card-title">Guided Expert Workflows</h3>
        </div>
      </div>

      <div className="presets-list">
        {EXPERT_WORKFLOW_PRESETS.map((preset) => {
          const isActive = preset.id === activePresetId;
          return (
            <div
              key={preset.id}
              className={`preset-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectPreset && onSelectPreset(preset)}
            >
              <div className="preset-header">
                <strong>{preset.title}</strong>
                <span className="preset-badge">{preset.badge}</span>
              </div>
              <p className="preset-subtitle">{preset.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
