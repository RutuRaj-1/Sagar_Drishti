import React from "react";
import { PALETTES, paletteGradientCss, PALETTE_NAMES } from "../utils/colormap.js";

/**
 * ColorbarEditor — Improvised Colorbar Controls Section
 * -----------------------------------------------------
 * High-interactivity palette switcher, auto-calibrate range reset,
 * contrast presets, and fine-tuning sliders to ensure the 2D map
 * feels completely dynamic and responsive.
 */

const PALETTE_DESCRIPTIONS = {
  thermal: "Temperature (Blue → Teal → Yellow → Red)",
  haline: "Salinity (Purple → Cyan → Green → Amber)",
  viridis: "SSH / General (Indigo → Teal → Yellow)",
  deep: "MLD / Pressure (Light Sky → Royal Blue → Black)",
  ice: "Drift / Velocity (Dark Slate → Cyan → Pure White)",
  velocity: "Currents (Navy → White → Deep Crimson)",
  rdbu: "Bipolar Anomalies (Blue = Low, Red = High)",
};

export default function ColorbarEditor({
  palette,
  onPaletteChange,
  colorMin,
  colorMax,
  onRangeChange,
  scale,
  onScaleChange,
  unit,
  nativeMin,
  nativeMax,
}) {
  // Reset to native dataset bounds
  const handleAutoCalibrate = () => {
    if (nativeMin !== undefined && nativeMax !== undefined) {
      onRangeChange(nativeMin, nativeMax);
    }
  };

  // Tighten contrast (P10 - P90 stretch)
  const handleBoostContrast = () => {
    if (colorMin !== undefined && colorMax !== undefined && colorMax > colorMin) {
      const span = colorMax - colorMin;
      const newMin = colorMin + span * 0.12;
      const newMax = colorMax - span * 0.12;
      onRangeChange(parseFloat(newMin.toFixed(2)), parseFloat(newMax.toFixed(2)));
    }
  };

  return (
    <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>

      {/* Active Colorbar Banner */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Active: <span style={{ color: "#0284c7" }}>{palette?.toUpperCase()}</span>
          </span>
          <span style={{ fontSize: 10, color: "#64748b", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {unit || ""}
          </span>
        </div>

        {/* Live gradient bar preview */}
        <div style={{
          height: 12,
          borderRadius: 6,
          background: paletteGradientCss(palette),
          border: "1.5px solid #cbd5e1",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
          marginBottom: 4
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "var(--font-mono)", color: "#334155", fontWeight: 700 }}>
          <span>{colorMin !== undefined && colorMin !== null ? Number(colorMin).toFixed(2) : "—"}</span>
          <span style={{ color: "#64748b", fontSize: 9, fontWeight: 500 }}>
            {colorMin !== undefined && colorMax !== undefined ? `Δ ${Math.abs(colorMax - colorMin).toFixed(2)}` : "Span"}
          </span>
          <span>{colorMax !== undefined && colorMax !== null ? Number(colorMax).toFixed(2) : "—"}</span>
        </div>
      </div>

      {/* Visual Palette Grid Swatches */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>
        Select Color Palette:
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 12 }}>
        {PALETTE_NAMES.map((p) => {
          const isActive = palette === p;
          return (
            <button
              key={p}
              onClick={() => onPaletteChange(p)}
              title={PALETTE_DESCRIPTIONS[p] || p}
              style={{
                background: isActive ? "#f0fdf4" : "#f8fafc",
                borderColor: isActive ? "#22c55e" : "#e2e8f0",
                borderWidth: 1.5,
                borderStyle: "solid",
                borderRadius: 6,
                padding: "5px 6px",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 3,
                transition: "all 0.12s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? "#15803d" : "#0f172a" }}>
                  {p}
                </span>
                {isActive && <span style={{ fontSize: 9, color: "#16a34a", fontWeight: 900 }}>✓</span>}
              </div>
              <div style={{ height: 6, borderRadius: 3, background: paletteGradientCss(p), width: "100%" }} />
            </button>
          );
        })}
      </div>

      {/* Min / Max Range Controls */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
            Data Clamp Range
          </span>
          {nativeMin !== undefined && nativeMax !== undefined && (
            <span style={{ fontSize: 9, color: "#64748b" }}>
              Native: {nativeMin.toFixed(1)} to {nativeMax.toFixed(1)}
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
          <div>
            <label style={{ fontSize: 9.5, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 2 }}>Min Bound</label>
            <input
              type="number"
              step="0.1"
              value={colorMin ?? ""}
              onChange={(e) => onRangeChange(parseFloat(e.target.value) || 0, colorMax)}
              style={{ width: "100%", padding: "5px 6px", borderRadius: 5, border: "1.5px solid #cbd5e1", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 9.5, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 2 }}>Max Bound</label>
            <input
              type="number"
              step="0.1"
              value={colorMax ?? ""}
              onChange={(e) => onRangeChange(colorMin, parseFloat(e.target.value) || 1)}
              style={{ width: "100%", padding: "5px 6px", borderRadius: 5, border: "1.5px solid #cbd5e1", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Action Quick Buttons */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={handleAutoCalibrate}
            style={{
              flex: 1, padding: "5px 4px", fontSize: 9.5, fontWeight: 700,
              borderRadius: 5, border: "1.5px solid #cbd5e1", background: "#f8fafc",
              color: "#0f172a", cursor: "pointer"
            }}
            title="Reset range to match current slice min and max"
          >
            🔄 Auto-Fit
          </button>
          <button
            onClick={handleBoostContrast}
            style={{
              flex: 1, padding: "5px 4px", fontSize: 9.5, fontWeight: 700,
              borderRadius: 5, border: "1.5px solid #cbd5e1", background: "#f8fafc",
              color: "#0f172a", cursor: "pointer"
            }}
            title="Stretch contrast for subtle ocean features"
          >
            ⚡ Contrast
          </button>
        </div>
      </div>

      {/* Scaling Mode Toggle */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
          Scaling Transfer Function:
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["linear", "log"].map((s) => (
            <button
              key={s}
              style={{
                flex: 1, padding: "5px 6px", fontSize: 10, fontWeight: 700,
                borderRadius: 5, cursor: "pointer",
                background: scale === s ? "#0284c7" : "#f1f5f9",
                color: scale === s ? "#ffffff" : "#475569",
                border: scale === s ? "1.5px solid #0284c7" : "1.5px solid #e2e8f0",
                transition: "all 0.12s"
              }}
              onClick={() => onScaleChange(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
