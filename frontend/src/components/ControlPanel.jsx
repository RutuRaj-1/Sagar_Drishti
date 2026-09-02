import React from "react";
import ColorbarEditor from "./ColorbarEditor.jsx";
import { paletteGradientCss } from "../utils/colormap.js";
import { varColor, varColorBg } from "../utils/colormap.js";

/**
 * ControlPanel — Left sidebar
 * Tier 1 & Tier 2 Master Controls:
 *  - Mode Switcher: CMEMS Real Model vs 4D Volumetric Multi-Depth
 *  - Variable Selector
 *  - Vertical Depth Slider (0m to 1000m)
 *  - Horizontal Current Vector Toggle
 *  - 3D Marching Cubes Isosurface Controls (Threshold & Opacity)
 *  - Time Navigator & Playback
 *  - Colorbar Editor
 */
export default function ControlPanel({
  meta,
  volumetricMeta,
  datasetMode = "cmems", // "cmems" | "volumetric"
  onDatasetModeChange,
  variable,
  onVariableChange,
  dateIndex,
  onDateIndexChange,
  dates = [],
  isPlaying,
  onTogglePlay,
  depthIndex = 0,
  onDepthIndexChange,
  depthLevels = [0, 10, 20, 50, 100, 200, 500, 1000],
  showCurrents = false,
  onToggleCurrents,
  showIsosurface = false,
  onToggleIsosurface,
  isovalue = 28.0,
  onIsovalueChange,
  verticalExaggeration = 1.5,
  onVerticalExaggerationChange,
  layerOpacity = 0.85,
  onLayerOpacityChange,
  palette,
  onPaletteChange,
  colorMin,
  colorMax,
  onRangeChange,
  colorScale,
  onColorScaleChange,
  activeVarInfo,
  viewMode,
}) {
  if (!meta && !volumetricMeta) {
    return (
      <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner" style={{ margin: "0 auto 14px" }} />
          <div style={{ fontSize: 11 }}>Loading Ocean Dataset…</div>
        </div>
      </div>
    );
  }

  const currentDate = dates?.[dateIndex] ?? meta?.time_start ?? "2026-08-31";
  const totalDates = dates?.length ?? 1;
  const currentDepth = depthLevels[depthIndex] ?? 0;

  const activeVariables = datasetMode === "volumetric"
    ? (volumetricMeta?.variables || [
        { name: "temperature", long_name: "Potential Temperature", units: "°C", icon: "🌡️" },
        { name: "salinity", long_name: "Practical Salinity", units: "PSU", icon: "🧂" },
        { name: "chlorophyll", long_name: "Chlorophyll-a", units: "mg/m³", icon: "🌿" },
        { name: "u_current", long_name: "Zonal Current (Eastward)", units: "m/s", icon: "➡️" },
        { name: "v_current", long_name: "Meridional Current (Northward)", units: "m/s", icon: "⬆️" },
      ])
    : (meta?.variables || []);

  return (
    <div className="panel">

      {/* ── Dataset Mode Switcher ─────────────────────── */}
      <div className="panel-section">
        <div className="panel-section-title">
          <span className="icon">🗂️</span> Model Dataset Source
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          <button
            className={`btn ${datasetMode === "cmems" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 10, padding: "7px 6px", fontWeight: 700 }}
            onClick={() => onDatasetModeChange("cmems")}
          >
            🛰️ CMEMS 5.8GB
          </button>
          <button
            className={`btn ${datasetMode === "volumetric" ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 10, padding: "7px 6px", fontWeight: 700 }}
            onClick={() => onDatasetModeChange("volumetric")}
          >
            🧊 4D Multi-Depth
          </button>
        </div>
        <div style={{ fontSize: 9.5, color: "var(--steel-500)", lineHeight: 1.4 }}>
          {datasetMode === "cmems"
            ? "Copernicus 1562-day gridded physics (5°N–22°N, 68°E–95°E)"
            : "4D Volumetric Model with 8 vertical depth layers & hydrodynamic flow fields"}
        </div>
      </div>

      {/* ── Vertical Depth Slider (Feature FR-2.3) ─────── */}
      {datasetMode === "volumetric" && (
        <div className="panel-section fade-up" style={{ background: "rgba(0, 212, 240, 0.05)", border: "1px solid rgba(0, 212, 240, 0.2)", borderRadius: "var(--radius)", padding: "10px" }}>
          <div className="panel-section-title" style={{ color: "#00d4f0", marginBottom: 6 }}>
            <span className="icon">📏</span> Vertical Depth Layer
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--steel-800)" }}>
              Depth: <strong style={{ color: "#00d4f0", fontFamily: "var(--font-mono)", fontSize: 13 }}>{currentDepth} m</strong>
            </span>
            <span style={{ fontSize: 9, color: "var(--steel-500)" }}>
              Layer {depthIndex + 1} of {depthLevels.length}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={depthLevels.length - 1}
            step={1}
            value={depthIndex}
            onChange={(e) => onDepthIndexChange(parseInt(e.target.value, 10))}
            style={{ width: "100%", marginBottom: 8 }}
          />

          {/* Quick depth jump pills */}
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {depthLevels.map((d, idx) => (
              <button
                key={d}
                onClick={() => onDepthIndexChange(idx)}
                style={{
                  padding: "2px 6px",
                  fontSize: 9,
                  borderRadius: 4,
                  border: `1px solid ${depthIndex === idx ? "#00d4f0" : "var(--steel-300)"}`,
                  background: depthIndex === idx ? "rgba(0, 212, 240, 0.2)" : "var(--steel-100)",
                  color: depthIndex === idx ? "#00d4f0" : "var(--steel-600)",
                  cursor: "pointer",
                  fontWeight: depthIndex === idx ? 700 : 400,
                }}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Hydrodynamic Currents & 3D Isosurface Toggles (Tier 2) ── */}
      <div className="panel-section">
        <div className="panel-section-title">
          <span className="icon">🌊</span> Ocean Dynamics & Isosurfaces
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Current Vectors Toggle */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--steel-700)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showCurrents}
              onChange={onToggleCurrents}
              style={{ accentColor: "#00d4f0" }}
            />
            <strong>Show Flow Vectors (u/v currents)</strong>
          </label>

          {/* 3D Marching Cubes Isosurface Toggle */}
          {viewMode === "3d" && (
            <div style={{ borderTop: "1px solid var(--steel-200)", paddingTop: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--steel-700)", cursor: "pointer", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={showIsosurface}
                  onChange={onToggleIsosurface}
                  style={{ accentColor: "#ff7675" }}
                />
                <strong>3D Marching Cubes Isosurface</strong>
              </label>

              {showIsosurface && (
                <div className="fade-up" style={{ paddingLeft: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--steel-600)", marginBottom: 3 }}>
                    <span>Isotherm Threshold:</span>
                    <strong style={{ color: "#ff7675" }}>{isovalue.toFixed(1)} °C</strong>
                  </div>
                  <input
                    type="range"
                    min={18.0}
                    max={30.0}
                    step={0.5}
                    value={isovalue}
                    onChange={(e) => onIsovalueChange(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <div style={{ fontSize: 8.5, color: "var(--steel-500)", marginTop: 2 }}>
                    (28°C+ = Cyclone Intensification Threshold)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Variable selector ──────────────────────────── */}
      <div className="panel-section">
        <div className="panel-section-title">
          <span className="icon">📡</span> Ocean Variable
        </div>
        {activeVariables.map((v) => {
          const vc = varColor(v.name);
          const vbg = varColorBg(v.name);
          return (
            <div
              key={v.name}
              className={`var-card${variable === v.name ? " active" : ""}`}
              style={{ "--var-color": vc, "--var-color-bg": vbg }}
              onClick={() => onVariableChange(v.name)}
            >
              <div className="var-icon" style={{ background: vbg, border: `1px solid ${vc}22` }}>
                {v.icon}
              </div>
              <div className="var-info">
                <div className="var-name">{v.long_name}</div>
                <div className="var-unit" style={{ color: vc }}>{v.units}</div>
                <div
                  className="var-palette-bar"
                  style={{ background: paletteGradientCss(v.palette || "thermal") }}
                />
              </div>
              {variable === v.name && (
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: vc, boxShadow: `0 0 8px ${vc}`,
                  flexShrink: 0,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Time control ──────────────────────────────── */}
      <div className="panel-section">
        <div className="panel-section-title">
          <span className="icon">📅</span> Time Navigator
        </div>
        <div className="date-range">
          {currentDate} &nbsp;·&nbsp; step {dateIndex + 1}/{totalDates}
        </div>
        <div className="field">
          <label>
            Scrub Date
            <span className="val">{currentDate}</span>
          </label>
          <input
            type="range"
            min={0}
            max={totalDates - 1}
            step={1}
            value={dateIndex}
            onChange={(e) => onDateIndexChange(parseInt(e.target.value, 10))}
          />
        </div>
        <div className="play-controls">
          <button
            className={`btn ${isPlaying ? "btn-secondary" : "btn-primary"}`}
            style={{ flex: 1 }}
            onClick={onTogglePlay}
          >
            {isPlaying ? "⏸ Pause" : "▶ Animate"}
          </button>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => onDateIndexChange(0)}
            title="Reset to start"
          >
            ⏮
          </button>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => onDateIndexChange(totalDates - 1)}
            title="Jump to latest"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* ── 3D display (only when in 3D view) ──────────── */}
      {viewMode === "3d" && (
        <div className="panel-section">
          <div className="panel-section-title">
            <span className="icon">🌐</span> 3D Display Controls
          </div>
          <div className="field">
            <label>
              Vertical Exaggeration
              <span className="val">{verticalExaggeration.toFixed(1)}×</span>
            </label>
            <input
              type="range" min="0.2" max="5" step="0.1"
              value={verticalExaggeration}
              onChange={(e) => onVerticalExaggerationChange(parseFloat(e.target.value))}
            />
          </div>
          <div className="field">
            <label>
              Layer Opacity
              <span className="val">{Math.round(layerOpacity * 100)}%</span>
            </label>
            <input
              type="range" min="0.1" max="1" step="0.05"
              value={layerOpacity}
              onChange={(e) => onLayerOpacityChange(parseFloat(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* ── Colorbar editor ──────────────────────────── */}
      <div className="panel-section">
        <div className="panel-section-title">
          <span className="icon">🎨</span> Colorbar Controls
        </div>
        <ColorbarEditor
          palette={palette}
          onPaletteChange={onPaletteChange}
          colorMin={colorMin}
          colorMax={colorMax}
          onRangeChange={onRangeChange}
          scale={colorScale}
          onScaleChange={onColorScaleChange}
          unit={activeVarInfo?.units || ""}
        />
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <div className="footer-note">
        🛰️ <strong>SAGAR-DRISHTI</strong> · SIH 26067 · INCOIS<br />
        CMEMS: E.U. Copernicus Marine Service<br />
        Argo + Gliders: Coriolis GDAC & INCOIS
      </div>
    </div>
  );
}
