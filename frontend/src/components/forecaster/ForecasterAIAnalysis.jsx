import React, { useMemo } from "react";
import { AITechnicalAnalysisGenerator } from "../../services/forecasterAdapter.js";

export default function ForecasterAIAnalysis({
  variable,
  date,
  depthIndex,
  depthLevels,
  surfaceStats,
}) {
  const analysis = useMemo(() => {
    return AITechnicalAnalysisGenerator.generateAnalysis({
      variable,
      date,
      depthIndex,
      depthLevels,
      surfaceStats,
    });
  }, [variable, date, depthIndex, depthLevels, surfaceStats]);

  return (
    <div className="forecaster-card forecaster-ai-card">
      <div className="forecaster-card-header">
        <div className="forecaster-card-icon">[AI]</div>
        <div className="forecaster-card-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="forecaster-badge tech-ai-badge">AI Technical Decision Support</span>
          </div>
          <h3 className="forecaster-card-title">Structured Model Intelligence</h3>
        </div>
      </div>

      {/* 1. Technical Summary */}
      <div className="analysis-section">
        <div className="analysis-section-title">
          1. Technical Synopsis
        </div>
        <p className="analysis-text">{analysis.summary}</p>
      </div>

      {/* 2. Warnings & Anomaly Alerts */}
      <div className="analysis-section">
        <div className="analysis-section-title">
          2. Warnings & Anomaly Alerts ({analysis.warnings.length})
        </div>
        <div className="warnings-list">
          {analysis.warnings.map((w, idx) => (
            <div key={idx} className={`warning-item ${w.level.toLowerCase()}`}>
              <div className="warn-content">
                <span className={`warn-level-tag ${w.level.toLowerCase()}`}>{w.level}</span>
                <span className="warn-text">{w.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Key Observations & Model Skills */}
      <div className="analysis-section">
        <div className="analysis-section-title">
          3. Observation Cross-Validation Insights
        </div>
        <div className="insights-tech-list">
          {analysis.insights.map((item, idx) => (
            <div key={idx} className="tech-insight-item">
              <span className="tech-insight-text">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Ensemble Predictions */}
      <div className="analysis-section">
        <div className="analysis-section-title">
          4. 72h Ensemble & Dynamics Predictions
        </div>
        <div className="predictions-list">
          {analysis.predictions.map((p, idx) => (
            <div key={idx} className="pred-item">
              <div className="pred-header">
                <span className="pred-horizon">{p.horizon}</span>
              </div>
              <p className="pred-text">{p.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="forecaster-disclaimer-box">
        <small>
          Note: AI-assisted analytical guidance derived from live Copernicus model assimilation & Coriolis Argo telemetry. For decision support only.
        </small>
      </div>
    </div>
  );
}
