import React, { useMemo } from "react";
import { computeProfileSummary } from "./ProfileChart.jsx";

/**
 * InstrumentSummaryPanel
 * ----------------------
 * Right sidebar on the Argo & Gliders page that provides:
 *  - Platform identity, model, institution, coordinates, basin
 *  - In-situ reading summary (surface layer, thermocline, deep layer)
 *  - Numerical model validation summary (RMSE, Bias, MAE against CMEMS)
 *  - Plain-English oceanographic interpretation
 */
export default function InstrumentSummaryPanel({ profile, modelProfile, selectedId }) {
  const summary = useMemo(() => {
    return computeProfileSummary(profile, modelProfile);
  }, [profile, modelProfile]);

  if (!selectedId) {
    return (
      <div className="argo-summary-sidebar">
        <div className="panel-section-title" style={{ color: "#0f172a", marginBottom: 14 }}>
          <span>📋</span> Telemetry & Reading Summary
        </div>
        <div style={{
          background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 8,
          padding: 24, textAlign: "center", color: "#64748b"
        }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>📡</div>
          <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            Select an Instrument
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            Click any float or glider from the left sidebar to inspect its coordinates, surface/deep readings, validation errors, and oceanographic water mass diagnosis.
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="argo-summary-sidebar">
        <div className="panel-section-title" style={{ color: "#0f172a", marginBottom: 14 }}>
          <span>📋</span> Telemetry & Reading Summary
        </div>
        <div style={{
          background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 8,
          padding: 24, textAlign: "center", color: "#64748b"
        }}>
          <div className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 2.5, margin: "0 auto 10px" }} />
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>Analyzing telemetry profile…</div>
        </div>
      </div>
    );
  }

  const { isGlider, tempValidation, salValidation } = summary;

  return (
    <div className="argo-summary-sidebar fade-up">
      <div className="panel-section-title" style={{ color: "#0f172a", marginBottom: 14 }}>
        <span>📋</span> Telemetry & Reading Summary
      </div>

      {/* ── Platform Profile & Coordinates Card ── */}
      <div style={{
        background: "#ffffff", border: "1.5px solid #e2e8f0",
        borderTop: isGlider ? "3px solid #00d4f0" : "3px solid #ef4444",
        borderRadius: 8, padding: 14, marginBottom: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span className={`tag ${isGlider ? "glider" : "argo"}`} style={{ fontSize: 9.5, padding: "2px 7px" }}>
            {isGlider ? "OCEAN GLIDER" : "ARGO PROFILER"}
          </span>
          <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
            Active Platform
          </span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
          {summary.platformId}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
          {summary.type}
        </div>

        {/* Location & Basin */}
        <div style={{
          marginTop: 10, padding: "8px 10px", background: "#f8fafc",
          borderRadius: 6, border: "1px solid #e2e8f0"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>BASIN</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0284c7" }}>
              📍 {summary.basin}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>COORDINATES</span>
            <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a" }}>
              {summary.lat.toFixed(3)}°N, {summary.lon.toFixed(3)}°E
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>DATE / CYCLE</span>
            <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: "#475569" }}>
              📅 {summary.timestamp}
            </span>
          </div>
        </div>

        {/* Provenance Metadata */}
        <div style={{ marginTop: 8, fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>
          <div><strong style={{ color: "#334155" }}>Institution:</strong> {summary.institution}</div>
          <div><strong style={{ color: "#334155" }}>Source:</strong> {summary.dataSource}</div>
        </div>
      </div>

      {/* ── Reading Summary (Graph Observations) ── */}
      <div style={{
        background: "#ffffff", border: "1.5px solid #e2e8f0",
        borderRadius: 8, padding: 14, marginBottom: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span>📊</span> In-Situ Reading Summary
        </div>

        {/* Surface Readings */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>Surface Temp (0–10m)</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#b91c1c", marginTop: 2 }}>
              {summary.surfaceTemp !== null ? `${summary.surfaceTemp} °C` : "—"}
            </div>
          </div>
          <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "#115e59", fontWeight: 700, textTransform: "uppercase" }}>Surface Salinity</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f766e", marginTop: 2 }}>
              {summary.surfaceSal !== null ? `${summary.surfaceSal} PSU` : "—"}
            </div>
          </div>
        </div>

        {/* Thermocline & Deep Readings */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Est. Mixed Layer</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
              ~{summary.estMld} m
            </div>
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Max Depth Profiled</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
              {summary.maxDepth} m
            </div>
          </div>
        </div>

        {/* Deep Bottom Reading */}
        <div style={{
          padding: "7px 10px", background: "#f1f5f9", borderRadius: 6,
          fontSize: 10.5, color: "#334155", display: "flex", justifyContent: "space-between"
        }}>
          <span>Deepest CTD Level ({summary.maxDepth}m):</span>
          <strong>{summary.deepTemp}°C · {summary.deepSal} PSU</strong>
        </div>
      </div>

      {/* ── Numerical Model Validation (vs CMEMS Forecast) ── */}
      <div style={{
        background: "#ffffff", border: "1.5px solid #e2e8f0",
        borderRadius: 8, padding: 14, marginBottom: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
            <span>🎯</span> Model Co-Location Errors
          </div>
          <span className="tag" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0", fontSize: 9 }}>
            CMEMS GLO12
          </span>
        </div>

        {tempValidation ? (
          <div>
            <div style={{ fontSize: 10.5, color: "#475569", marginBottom: 6 }}>
              Temperature Error ({tempValidation.n} coincident depth layers):
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, textAlign: "center" }}>
              <div style={{ background: "#f8fafc", padding: "5px 4px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 8.5, color: "#64748b", fontWeight: 700 }}>MAE</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{tempValidation.mae.toFixed(3)}°C</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "5px 4px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 8.5, color: "#64748b", fontWeight: 700 }}>RMSE</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{tempValidation.rmse.toFixed(3)}°C</div>
              </div>
              <div style={{ background: "#f8fafc", padding: "5px 4px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 8.5, color: "#64748b", fontWeight: 700 }}>BIAS</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: tempValidation.bias >= 0 ? "#dc2626" : "#2563eb" }}>
                  {tempValidation.bias > 0 ? `+${tempValidation.bias.toFixed(3)}` : tempValidation.bias.toFixed(3)}°C
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>
            Model forecast data co-locating at ({summary.lat.toFixed(2)}°N, {summary.lon.toFixed(2)}°E)…
          </div>
        )}
      </div>

      {/* ── Oceanographic Physical Insight ── */}
      <div style={{
        background: "#eff6ff", border: "1.5px solid #bfdbfe",
        borderRadius: 8, padding: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#1e40af", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span>🌊</span> Oceanographic Water Mass Insight
        </div>
        <div style={{ fontSize: 11, color: "#1e3a8a", lineHeight: 1.6 }}>
          {summary.insight}
        </div>
      </div>

    </div>
  );
}
