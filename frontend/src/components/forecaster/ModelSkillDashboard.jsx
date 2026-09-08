import React from "react";
import { MODEL_SKILL_BASELINES } from "../../data/forecasterData.js";

export default function ModelSkillDashboard() {
  const skill = MODEL_SKILL_BASELINES;

  return (
    <div className="forecaster-card model-skill-card">
      <div className="forecaster-card-header">
        <div className="forecaster-card-icon">🎯</div>
        <div className="forecaster-card-title-group">
          <span className="forecaster-badge">Model Verification</span>
          <h3 className="forecaster-card-title">Forecast Skill & Data Quality</h3>
        </div>
      </div>

      {/* Layer Error Meters */}
      <div className="skill-layers-container">
        <div className="skill-layer-box">
          <div className="layer-header">
            <strong>Surface Layer (0m)</strong>
            <span className="skill-status-tag good">GOOD SKILL</span>
          </div>
          <div className="error-meters-row">
            <div className="error-meter">
              <span>MAE: <strong>{skill.surface.temp_mae}°C</strong></span>
              <div className="meter-track"><div className="meter-fill" style={{ width: "38%" }} /></div>
            </div>
            <div className="error-meter">
              <span>RMSE: <strong>{skill.surface.temp_rmse}°C</strong></span>
              <div className="meter-track"><div className="meter-fill" style={{ width: "49%" }} /></div>
            </div>
          </div>
          <small className="bias-text">Bias: {skill.surface.bias}</small>
        </div>

        <div className="skill-layer-box">
          <div className="layer-header">
            <strong>Subsurface Layer (0–200m)</strong>
            <span className="skill-status-tag moderate">MODERATE SKILL</span>
          </div>
          <div className="error-meters-row">
            <div className="error-meter">
              <span>MAE: <strong>{skill.subsurface_200m.temp_mae}°C</strong></span>
              <div className="meter-track"><div className="meter-fill mod" style={{ width: "62%" }} /></div>
            </div>
            <div className="error-meter">
              <span>RMSE: <strong>{skill.subsurface_200m.temp_rmse}°C</strong></span>
              <div className="meter-track"><div className="meter-fill mod" style={{ width: "78%" }} /></div>
            </div>
          </div>
          <small className="bias-text">Bias: {skill.subsurface_200m.bias}</small>
        </div>
      </div>

      {/* Sensor Coverage & Latency */}
      <div className="telemetry-status-box">
        <div className="telemetry-title">Active Telemetry Coverage</div>
        <div className="telemetry-grid">
          <div className="tele-item">
            <span>Argo Floats:</span> <strong>{skill.sensor_coverage.argo_floats} Active</strong>
          </div>
          <div className="tele-item">
            <span>Gliders:</span> <strong>{skill.sensor_coverage.ocean_gliders} Active</strong>
          </div>
          <div className="tele-item">
            <span>HF Radar:</span> <strong>{skill.sensor_coverage.hf_radar_stations} Stations</strong>
          </div>
          <div className="tele-item">
            <span>RAMA Buoys:</span> <strong>{skill.sensor_coverage.rama_buoys} Moorings</strong>
          </div>
        </div>
        <div className="latency-bar-row">
          <span>Latency:</span>
          <span className="mono">{skill.sensor_coverage.latency_breakdown}</span>
        </div>
      </div>
    </div>
  );
}
