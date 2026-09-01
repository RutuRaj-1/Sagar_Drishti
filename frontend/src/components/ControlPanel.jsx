import React from "react";
import ColorbarEditor from "./ColorbarEditor.jsx";
import { paletteGradientCss } from "../utils/colormap.js";
import { varColor, varColorBg, varGradient, VARIABLE_COLORS } from "../utils/colormap.js";

/**
 * ControlPanel — Left sidebar (CMEMS model controls)
 * FR-VIS-2/3/4/5, FR-CTRL-1/2
 *
 * Variable cards use the color-semantic system:
 *   tob → coral-red, sob → teal, zos → sky-blue, mlotst → purple,
 *   pbo → pink, sivelo → ice-white
 */
export default function ControlPanel({
  meta,
  variable, onVariableChange,
  dateIndex, onDateIndexChange,
  dates,
  isPlaying, onTogglePlay,
  verticalExaggeration, onVerticalExaggerationChange,
  layerOpacity, onLayerOpacityChange,
  palette, onPaletteChange,
  colorMin, colorMax, onRangeChange,
  colorScale, onColorScaleChange,
  activeVarInfo,
  viewMode,
}) {
  if (!meta) {
    return (
      <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner" style={{ margin: "0 auto 14px" }} />
          <div style={{ fontSize: 11, fontFamily: "var(--font-body)" }}>Loading CMEMS dataset…</div>
        </div>
      </div>
    );
  }

  const currentDate = dates?.[dateIndex] ?? meta.time_start;
  const totalDates = dates?.length ?? 1;

  return (
    <div className="panel">

      {/* ── Data source badges ──────────────────────────── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <span className="cmems-badge">🛰️ CMEMS</span>
        <span className="argo-badge">🔴 Argo NC</span>
      </div>

      {/* ── Variable selector ──────────────────────────── */}
      <div className="panel-section">
        <div className="panel-section-title">
          <span className="icon">📡</span> Ocean Variable (CMEMS Model)
        </div>
        {meta.variables.map((v) => {
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
                  style={{ background: paletteGradientCss(v.palette) }}
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

      {/* ── Active variable description ─────────────────── */}
      {activeVarInfo && (
        <div className="info-box" style={{
          borderColor: `${varColor(variable)}30`,
          background: varColorBg(variable),
        }}>
          <div className="info-title" style={{ color: varColor(variable) }}>
            {activeVarInfo.icon} {activeVarInfo.long_name}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-2)", lineHeight: 1.6 }}>
            {activeVarInfo.description}
          </div>
        </div>
      )}

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
        <div className="muted-text" style={{ marginTop: 7 }}>
          CMEMS: {meta.time_start} → {meta.time_end} ({totalDates} days)
        </div>
      </div>

      {/* ── 3D display (only when in 3D view) ──────────── */}
      {viewMode === "3d" && (
        <div className="panel-section">
          <div className="panel-section-title">
            <span className="icon">🌐</span> 3D Display
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
              Surface Opacity
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
          <span className="icon">🎨</span> Colorbar
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

      {/* ── Pipeline steps ────────────────────────────── */}
      <div className="panel-section">
        <div className="panel-section-title">
          <span className="icon">⚡</span> Data Pipeline
        </div>
        <div className="pipeline-steps">
          {[
            { cls: "step-ingest", icon: "📥", label: "CMEMS NC Ingestion", sub: "xarray lazy-load · 5.8 GB" },
            { cls: "step-argo",   icon: "🔴", label: "Argo Float NC Parse", sub: "91 floats · Jun–Aug 2026" },
            { cls: "step-api",    icon: "⚙️", label: "FastAPI REST Layer",  sub: "surface / profile / stats" },
            { cls: "step-viz",    icon: "🌐", label: "WebGL Visualization", sub: "Canvas 2D + Three.js 3D" },
            { cls: "step-analytics", icon: "📊", label: "Analytics Engine", sub: "trend · correlation · anomaly" },
          ].map(({ cls, icon, label, sub }) => (
            <div key={label} className={`pipeline-step ${cls}`}>
              <div className="pipeline-step-dot" style={{ background: "currentColor" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 11, color: "currentColor" }}>{icon} {label}</div>
                <div style={{ fontSize: 9.5, color: "var(--muted)", marginTop: 1 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <div className="footer-note">
        🛰️ <strong>SAGAR-DRISHTI</strong> · SIH 26067 · INCOIS<br />
        CMEMS: E.U. Copernicus Marine Service<br />
        Argo: Coriolis DataSelection Export<br />
        Domain: {meta.region}
      </div>
    </div>
  );
}
