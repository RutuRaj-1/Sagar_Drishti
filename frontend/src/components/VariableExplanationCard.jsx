import React from "react";
import { varColor, paletteGradientCss, paletteForVariable } from "../utils/colormap.js";

/**
 * VariableExplanationCard — Scientific Oceanographic Explanation
 * Rendered in the Right Section of the 2D/3D Viewport.
 * Implements SRS §3.6.4 & §4: High-readability oceanographic interpretation,
 * colorbar interpretation guide, and regional Indian Ocean context.
 */

const VARIABLE_GUIDES = {
  tob: {
    title: "Sea Bottom Temperature",
    standardName: "sea_water_potential_temperature_at_sea_floor",
    category: "Benthic Thermal Physics",
    unit: "°C",
    palette: "thermal",
    summary: "Potential temperature measured at the deepest ocean layer adjacent to the sea floor bathymetry.",
    indianOceanDynamics: "In the Northern Indian Ocean, sea bottom temperature reflects the northward propagation of cold Antarctic Bottom Water (AABW) and Indian Ocean Deep Water (IODW). In shallow shelf regions (e.g., Gulf of Khambhat, Palk Strait), temperatures remain warm (26–29°C), whereas abyssal deeps (>3,000m) in the Central Indian Basin and Arabian Basin drop below 2°C.",
    colorInterpretation: "Deep navy and royal blue depict frigid abyssal waters (<4°C). Teals and greens trace continental slope transitions (8–18°C). Warm oranges and deep reds highlight sun-warmed coastal shelf and shallow embayment zones (>24°C).",
    significance: "Crucial for benthic habitat monitoring, identifying cold-core upwelling fronts along the Malabar coast, and modeling vertical heat diffusion into the abyss."
  },
  sob: {
    title: "Sea Bottom Salinity",
    standardName: "sea_water_salinity_at_sea_floor",
    category: "Thermohaline Halocline Dynamics",
    unit: "PSU",
    palette: "haline",
    summary: "Practical salinity at the sea bed, determining bottom-water density and thermohaline circulation pathways.",
    indianOceanDynamics: "The Indian Ocean exhibits a stark salinity asymmetry: the Arabian Sea is an evaporative basin with hypersaline waters (>36.5 PSU) formed by arid winds and Red Sea/Persian Gulf outflow. In contrast, the Bay of Bengal receives massive freshwater runoff (~1.6×10¹² m³/yr) from the Ganges, Brahmaputra, and Godavari rivers, creating low-salinity bottom waters on coastal shelves (<32 PSU).",
    colorInterpretation: "Purples and deep blues mark freshwater-diluted coastal shelf waters (<33 PSU). Vibrant cyans and emerald greens show open-basin ambient salinity (34.5–35.5 PSU). Bright golds and yellows delineate the dense, hypersaline Arabian Sea water mass (>36.2 PSU).",
    significance: "Vital for tracking river plume subduction, barrier layer formation, and deep thermohaline conveyor exchange between the Arabian Sea and Bay of Bengal."
  },
  zos: {
    title: "Sea Surface Height (SSH)",
    standardName: "sea_surface_height_above_geoid",
    category: "Geostrophic Dynamics & Sea Level",
    unit: "m",
    palette: "viridis",
    summary: "Dynamic topography of the ocean surface relative to the earth's geoid, driven by currents, heat content, and winds.",
    indianOceanDynamics: "SSH is the primary signature of mesoscale eddies and planetary waves. Positive SSH anomalies (+0.1 to +0.4m) indicate warm-core anticyclonic eddies and downwelling regimes. Depressed SSH (-0.1 to -0.3m) marks cold-core cyclonic eddies, notably the famous Sri Lanka Dome (SLD) and offshore upwelling cells during the Southwest Monsoon.",
    colorInterpretation: "Deep purple and indigo indicate negative SSH troughs and cold-core cyclonic eddy upwelling. Cyan and leaf greens represent neutral sea level. Brilliant yellow marks positive SSH ridges and anticyclonic warm-core rings.",
    significance: "Directly used by INCOIS for tropical cyclone intensity forecasting (high SSH = high Ocean Heat Content) and predicting geostrophic surface current transport."
  },
  mlotst: {
    title: "Mixed Layer Depth (MLD)",
    standardName: "ocean_mixed_layer_thickness",
    category: "Upper-Ocean Boundary Layer",
    unit: "m",
    palette: "deep",
    summary: "Thickness of the surface ocean layer where turbulence and wave action maintain uniform temperature and density.",
    indianOceanDynamics: "During the Southwest Monsoon (June–Sept), strong Findlater Jet winds deepen the Arabian Sea mixed layer to >80m. Conversely, in the Northern Bay of Bengal, fresh river water creates an intense halocline capping a very shallow mixed layer (<15–25m), creating a 'barrier layer' that traps solar heat and accelerates rapid cyclone intensification.",
    colorInterpretation: "Pale ivory and light cyan indicate very shallow mixed layers (<20m, thin barrier layers). Medium sky-blue denotes moderate mixing (30–60m). Dark navy and midnight blue reveal deeply mixed convective columns (>80m).",
    significance: "Primary control parameter for monsoon air-sea heat exchange, phytoplankton bloom timing, and cyclone rapid intensification warnings."
  },
  pbo: {
    title: "Sea Floor Pressure",
    standardName: "sea_water_pressure_at_sea_floor",
    category: "Abyssal Hydrostatics & Bathymetry",
    unit: "dbar",
    palette: "deep",
    summary: "Hydrostatic water column pressure acting on the sea floor (1 dbar ≈ 1 metre of ocean depth).",
    indianOceanDynamics: "Directly maps the profound underwater topography of the Indian Ocean, from shallow coastal shelves (<200 dbar) to the Carlsberg Ridge, Chagos-Laccadive Ridge, and deep abyssal plains (>4,000 dbar) in the Bay of Bengal fan.",
    colorInterpretation: "Bright light tones trace shallow continental margins (<500 dbar). Progressively darker navy hues track the steep descent down the continental slope into the deep abyss (>3,500 dbar).",
    significance: "Key for tsunami wave propagation modeling, bottom friction dissipation, and deep ocean circulation routing."
  },
  sivelo: {
    title: "Surface Drift Velocity / Speed",
    standardName: "surface_geostrophic_sea_water_velocity",
    category: "Kinematic Drift Velocity",
    unit: "m/s",
    palette: "speed",
    summary: "Magnitude of surface geostrophic current drift velocity (m/s) derived from Sea Surface Height (SSH) gradients and Coriolis balance.",
    indianOceanDynamics: "The Northern Indian Ocean features intense, seasonally reversing boundary currents. During the Southwest Monsoon, the Somali Current and Findlater-driven flows exceed 1.5–2.0 m/s. Strong mesoscale eddy circulations encircle the Sri Lanka Dome (SLD) and flow along the East India Coastal Current (EICC) in the Bay of Bengal, transporting massive heat and freshwater parcels.",
    colorInterpretation: "Deep midnight and sapphire navy represent calm, quiescent waters (<0.15 m/s). Cyan, turquoise, and emerald green trace ambient drift and eddy flanks (0.2–0.6 m/s). Warm golds, vibrant oranges, and crimson reds illuminate high-speed boundary jets, coastal upwelling currents, and western boundary intensification (>1.0 m/s).",
    significance: "Crucial for marine navigation routing, search-and-rescue drift modeling, oil spill trajectory forecasts, and tracking monsoon heat transport into the Arabian Sea warm pool."
  },
  temperature: {
    title: "3D Multi-Depth Temperature",
    standardName: "sea_water_potential_temperature",
    category: "3D Volumetric Physics",
    unit: "°C",
    palette: "thermal",
    summary: "Co-located volumetric water temperature across 34 vertical depth levels (1.5m to 902m).",
    indianOceanDynamics: "Shows the full 3D thermal structure: tropical warm pool (>28.5°C) at the surface, the steep permanent thermocline between 80m and 250m, and sub-thermocline cooling down to 7°C at 900m depth.",
    colorInterpretation: "Deep blue denotes sub-thermocline cold water (<10°C). Cyan/green marks the thermocline (15–22°C). Red/crimson highlights the surface mixed layer (>28°C).",
    significance: "Validates in-situ Argo float profiles and evaluates ocean heat content (OHC) down to 900m."
  },
  salinity: {
    title: "3D Multi-Depth Salinity",
    standardName: "sea_water_salinity",
    category: "3D Volumetric Haline",
    unit: "PSU",
    palette: "haline",
    summary: "Volumetric salinity across 34 vertical depth levels from surface to 902m depth.",
    indianOceanDynamics: "Reveals the subsurface salinity maximum (Arabian Sea High Salinity Water, ASHSW) subducting southward, and the fresh surface layer of the Bay of Bengal riding over denser saline waters.",
    colorInterpretation: "Purple marks low-salinity surface waters. Cyan/green shows intermediate salinity. Gold/amber highlights high-salinity sub-surface cores (>36 PSU).",
    significance: "Critical for understanding 3D water mass formation and sub-surface halocline stability."
  }
};

export default function VariableExplanationCard({ variable, colorRange, surface }) {
  const guide = VARIABLE_GUIDES[variable] || {
    title: variable,
    standardName: variable,
    category: "Oceanographic Metric",
    unit: "",
    palette: paletteForVariable(variable),
    summary: "Ocean physical state variable from the Copernicus Marine Service reanalysis.",
    indianOceanDynamics: "Monitored across the Northern Indian Ocean domain covering the Bay of Bengal, Arabian Sea, and Equatorial zone.",
    colorInterpretation: "Mapped continuously across the dataset's calibrated min-max range.",
    significance: "Supports operational ocean intelligence and numerical modeling."
  };

  const vc = varColor(variable);
  const activePal = guide.palette || paletteForVariable(variable);

  // Surface reading statistics
  const minVal = colorRange?.min ?? surface?.min_value;
  const maxVal = colorRange?.max ?? surface?.max_value;
  const meanVal = surface?.mean_value;

  return (
    <div className="glass-card fade-up" style={{
      background: "#ffffff",
      border: "1.5px solid #e2e8f0",
      borderTop: `3px solid ${vc}`,
      borderRadius: 10,
      padding: "18px 16px",
      marginBottom: 16,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 15,
              fontWeight: 800,
              color: "#0f172a"
            }}>
              {guide.title}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 3, fontWeight: 600 }}>
            {guide.category} &nbsp;·&nbsp; <span className="mono" style={{ color: vc, fontWeight: 700 }}>{variable}</span>
          </div>
        </div>

        <span style={{
          background: "#f1f5f9",
          border: "1px solid #cbd5e1",
          borderRadius: 5,
          padding: "3px 9px",
          fontSize: 12,
          fontWeight: 800,
          color: "#334155",
          fontFamily: "var(--font-mono)"
        }}>
          {guide.unit || "unitless"}
        </span>
      </div>

      {/* Summary */}
      <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.65, marginBottom: 14 }}>
        {guide.summary}
      </div>

      {/* Synchronized Live Colormap Guide Bar */}
      <div style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "11px 12px 9px",
        marginBottom: 14
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", fontWeight: 700, marginBottom: 6 }}>
          <span>🎨 ACTIVE COLORBAR ({activePal.toUpperCase()})</span>
          <span style={{ color: vc }}>{guide.unit}</span>
        </div>
        <div
          style={{
            height: 12,
            borderRadius: 6,
            background: paletteGradientCss(activePal),
            border: "1px solid rgba(0,0,0,0.08)",
            marginBottom: 6
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontFamily: "var(--font-mono)", color: "#0f172a", fontWeight: 700 }}>
          <span>{minVal !== undefined && minVal !== null ? minVal.toFixed(2) : "—"}</span>
          <span style={{ color: "#64748b", fontSize: 10.5, fontWeight: 500 }}>
            {meanVal !== undefined ? `Mean: ${meanVal.toFixed(2)}` : "Calibrated"}
          </span>
          <span>{maxVal !== undefined && maxVal !== null ? maxVal.toFixed(2) : "—"}</span>
        </div>
      </div>

      {/* Indian Ocean Context & Dynamics */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
          <span>🌊</span> Indian Ocean Scientific Context:
        </div>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65 }}>
          {guide.indianOceanDynamics}
        </div>
      </div>

      {/* How to read the colors on the 2D map */}
      <div style={{
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: 7,
        padding: "10px 12px",
        marginBottom: 12
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#166534", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <span>👁️</span> 2D Map Color Reading Guide:
        </div>
        <div style={{ fontSize: 12, color: "#14532d", lineHeight: 1.6 }}>
          {guide.colorInterpretation}
        </div>
      </div>

      {/* Key Application */}
      <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.6, borderTop: "1px dashed #e2e8f0", paddingTop: 10 }}>
        💡 <strong style={{ color: "#334155" }}>Operational Role:</strong> {guide.significance}
      </div>
    </div>
  );
}
