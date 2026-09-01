import React from "react";
import { PALETTES, paletteGradientCss, PALETTE_NAMES } from "../utils/colormap.js";

/**
 * ColorbarEditor — FR-CTRL-2
 * Palette selection (visual swatches), custom min/max range, log/linear scale.
 * Redesigned with visual palette thumbnails for the SAGAR-DRISHTI UI.
 */
export default function ColorbarEditor({
  palette, onPaletteChange,
  colorMin, colorMax, onRangeChange,
  scale, onScaleChange,
  unit,
}) {
  return (
    <div>
      {/* Visual palette swatches */}
      <div className="palette-grid">
        {PALETTE_NAMES.map((p) => (
          <div
            key={p}
            className={`palette-option${palette === p ? " active" : ""}`}
            onClick={() => onPaletteChange(p)}
            title={p}
          >
            <div
              className="palette-bar-h"
              style={{ background: paletteGradientCss(p) }}
            />
            <div className="palette-name">{p}</div>
          </div>
        ))}
      </div>

      {/* Active colorbar preview */}
      <div className="field">
        <div style={{ height: 10, borderRadius: 5, background: paletteGradientCss(palette) }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginTop: 3, fontFamily: "Fira Mono, monospace" }}>
          <span>{colorMin?.toFixed(2)} {unit}</span>
          <span>mid</span>
          <span>{colorMax?.toFixed(2)} {unit}</span>
        </div>
      </div>

      {/* Min / Max inputs */}
      <div className="row field">
        <div>
          <label>Min</label>
          <input
            type="number"
            step="0.01"
            value={colorMin ?? ""}
            onChange={(e) => onRangeChange(parseFloat(e.target.value), colorMax)}
          />
        </div>
        <div>
          <label>Max</label>
          <input
            type="number"
            step="0.01"
            value={colorMax ?? ""}
            onChange={(e) => onRangeChange(colorMin, parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* Scale toggle */}
      <div className="field">
        <label>Scale</label>
        <div className="row">
          {["linear", "log"].map((s) => (
            <button
              key={s}
              className={`btn ${scale === s ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: 11 }}
              onClick={() => onScaleChange(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
