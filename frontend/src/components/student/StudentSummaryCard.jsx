import React, { useState } from "react";
import { StudentDataProvider } from "../../services/studentAdapter.js";

export default function StudentSummaryCard({
  variable,
  date,
  depthIndex,
  depthLevels,
  surfaceStats,
}) {
  const [expanded, setExpanded] = useState(false);

  const summary = StudentDataProvider.getSummary({
    variable,
    date,
    depthIndex,
    depthLevels,
    surfaceStats,
  });

  return (
    <div className="student-card student-summary-card">
      <div className="student-card-header">
        <div className="student-card-icon">📖</div>
        <div className="student-card-title-group">
          <span className="student-badge">Student Overview</span>
          <h3 className="student-card-title">{summary.title}</h3>
        </div>
      </div>

      <div className="student-summary-text">
        <p>{summary.plainSummary}</p>
      </div>

      <button
        className="student-expand-btn"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span>{expanded ? "Hide Explanation" : "What am I seeing?"}</span>
        <span className="expand-arrow">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="student-explanation-drawer">
          <div className="explanation-item">
            <h4>💡 What is this parameter?</h4>
            <p>{summary.laymanSummary}</p>
          </div>

          <div className="explanation-item">
            <h4>🎨 Color Scale Guide</h4>
            <p>{summary.colorScaleMeaning}</p>
          </div>

          <div className="explanation-item">
            <h4>🌊 Why it matters</h4>
            <p>{summary.whyItMatters}</p>
          </div>

          <div className="explanation-item note">
            <small>
              📍 Note: Click any point on the 2D map to inspect historical trends at that specific location.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
