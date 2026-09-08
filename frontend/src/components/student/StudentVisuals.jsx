import React, { useState } from "react";
import { StudentDataProvider } from "../../services/studentAdapter.js";
import { COASTAL_PRESETS } from "../../data/studentData.js";
import { paletteGradientCss } from "../../utils/colormap.js";

export default function StudentVisuals({
  variable,
  palette,
  surfaceStats,
  depthIndex,
  depthLevels,
}) {
  const [showScientific, setShowScientific] = useState(false);
  const [loc1Id, setLoc1Id] = useState("mumbai");
  const [loc2Id, setLoc2Id] = useState("chennai");

  const health = StudentDataProvider.getOceanHealth({ variable, surfaceStats });
  const comparison = StudentDataProvider.compareLocations(loc1Id, loc2Id, variable);

  const activeDepth = depthLevels?.[depthIndex] ?? 0;

  return (
    <div className="student-visuals-container">
      {/* ── OCEAN HEALTH TODAY BADGE ── */}
      <div
        className="student-card ocean-health-card"
        style={{
          background: health.bgColor,
          borderColor: health.borderColor,
        }}
      >
        <div className="health-header">
          <div className="health-badge-row">
            <span className={`health-dot ${health.status}`} />
            <strong style={{ color: health.color }}>{health.badgeText}</strong>
          </div>
          <span className="edu-tag">Educational Status</span>
        </div>
        <p className="health-explanation">{health.explanation}</p>
      </div>

      {/* ── VERTICAL DEPTH GRADIENT BAR ── */}
      <div className="student-card depth-gradient-card">
        <div className="student-card-header">
          <div className="student-card-icon">🌊</div>
          <div className="student-card-title-group">
            <span className="student-badge">Depth Profile</span>
            <h3 className="student-card-title">Water Column Zones</h3>
          </div>
        </div>

        <p className="visual-subtitle">
          How temperature and light change from top to bottom
        </p>

        <div className="depth-gradient-wrapper">
          <div
            className="depth-gradient-bar"
            style={{ background: paletteGradientCss(palette || "thermal") }}
          />

          <div className="depth-zones">
            <div className={`depth-zone ${activeDepth === 0 ? "active" : ""}`}>
              <span className="zone-marker">0m</span>
              <div className="zone-info">
                <strong>Sunlight Surface Zone</strong>
                <small>Warm, sunlit, stirred by winds (~28°C)</small>
              </div>
            </div>

            <div className={`depth-zone ${activeDepth > 0 && activeDepth <= 200 ? "active" : ""}`}>
              <span className="zone-marker">100m – 200m</span>
              <div className="zone-info">
                <strong>Thermocline Twilight Zone</strong>
                <small>Sunlight fades, sharp temperature drop (~18°C)</small>
              </div>
            </div>

            <div className={`depth-zone ${activeDepth > 200 ? "active" : ""}`}>
              <span className="zone-marker">500m+</span>
              <div className="zone-info">
                <strong>Deep Dark Zone</strong>
                <small>Pitch black, near-freezing cold (~4°C to 8°C)</small>
              </div>
            </div>
          </div>
        </div>

        <button
          className="student-expand-btn"
          onClick={() => setShowScientific(!showScientific)}
          style={{ marginTop: 12 }}
        >
          <span>{showScientific ? "Hide Scientific Details" : "Show Scientific Readings"}</span>
          <span>{showScientific ? "^" : "v"}</span>
        </button>

        {showScientific && (
          <div className="scientific-details-box">
            <div className="detail-stat">
              <span>Active Depth Level:</span>
              <strong>{activeDepth} meters</strong>
            </div>
            <div className="detail-stat">
              <span>Domain Min:</span>
              <strong>{surfaceStats?.min_value?.toFixed(2) ?? "—"}</strong>
            </div>
            <div className="detail-stat">
              <span>Domain Max:</span>
              <strong>{surfaceStats?.max_value?.toFixed(2) ?? "—"}</strong>
            </div>
            <div className="detail-stat">
              <span>Domain Mean:</span>
              <strong>{surfaceStats?.mean_value?.toFixed(2) ?? "—"}</strong>
            </div>
          </div>
        )}
      </div>

      {/* ── COMPARE TWO PLACES ── */}
      <div className="student-card compare-places-card">
        <div className="student-card-header">
          <div className="student-card-icon">📍</div>
          <div className="student-card-title-group">
            <span className="student-badge">Side-by-Side</span>
            <h3 className="student-card-title">Compare Two Places</h3>
          </div>
        </div>

        <div className="compare-selectors">
          <div className="compare-select-group">
            <label>Location A:</label>
            <select value={loc1Id} onChange={(e) => setLoc1Id(e.target.value)}>
              {COASTAL_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="compare-vs">VS</div>

          <div className="compare-select-group">
            <label>Location B:</label>
            <select value={loc2Id} onChange={(e) => setLoc2Id(e.target.value)}>
              {COASTAL_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="compare-bars-wrapper">
          <div className="compare-bar-item">
            <div className="compare-item-header">
              <span>{comparison.loc1.name}</span>
              <strong>{comparison.val1}{comparison.unit}</strong>
            </div>
            <div className="compare-track">
              <div
                className="compare-fill fill-a"
                style={{ width: `${Math.min(100, (comparison.val1 / 38) * 100)}%` }}
              />
            </div>
          </div>

          <div className="compare-bar-item">
            <div className="compare-item-header">
              <span>{comparison.loc2.name}</span>
              <strong>{comparison.val2}{comparison.unit}</strong>
            </div>
            <div className="compare-track">
              <div
                className="compare-fill fill-b"
                style={{ width: `${Math.min(100, (comparison.val2 / 38) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="compare-verdict">
          <span>💡</span>
          <strong>{comparison.verdict}</strong>
        </div>
      </div>
    </div>
  );
}
