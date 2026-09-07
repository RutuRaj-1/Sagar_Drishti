import React, { useMemo } from "react";
import { AIInsightsGenerator } from "../../services/studentAdapter.js";

export default function StudentAIInsights({
  variable,
  date,
  depthIndex,
  depthLevels,
  surfaceStats,
}) {
  const insights = useMemo(() => {
    return AIInsightsGenerator.generateInsights({
      variable,
      date,
      depthIndex,
      depthLevels,
      surfaceStats,
    });
  }, [variable, date, depthIndex, depthLevels, surfaceStats]);

  return (
    <div className="student-card student-insights-card">
      <div className="student-card-header">
        <div className="student-card-icon">✨</div>
        <div className="student-card-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="student-badge ai-badge">AI-Generated Insights</span>
            <span className="live-sparkle">✦</span>
          </div>
          <h3 className="student-card-title">Ocean Intelligence Summary</h3>
        </div>
      </div>

      <div className="insights-list">
        {insights.map((item, idx) => (
          <div key={idx} className={`insight-item ${item.type}`}>
            <span className="insight-icon">{item.icon}</span>
            <span className="insight-text">{item.text}</span>
          </div>
        ))}
      </div>

      <div className="student-disclaimer-box">
        <span>ℹ️</span>
        <small>
          AI-generated educational summary based on live model fields & Argo telemetry. Not an official storm or fishing advisory.
        </small>
      </div>
    </div>
  );
}
