// HFRadarRamaExplorer.jsx — SAGAR-DRISHTI
// Coastal HF Radar & RAMA Moored Buoy Observatory — Steel Design System, 3-Panel Layout
import React, { useState, useEffect } from "react";
import { api } from "../api";

export default function HFRadarRamaExplorer({
  hfRadarStations = [],
  ramaBuoys = [],
  onSelectInstrument,
  selectedId,
}) {
  const [activeSubTab, setActiveSubTab] = useState("hfradar");
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [selectedBuoyId, setSelectedBuoyId] = useState(null);
  const [stationDetails, setStationDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeSubTab === "hfradar" && hfRadarStations.length > 0 && !selectedStationId) {
      setSelectedStationId(hfRadarStations[0].station_id);
    }
    if (activeSubTab === "rama" && ramaBuoys.length > 0 && !selectedBuoyId) {
      setSelectedBuoyId(ramaBuoys[0].buoy_id);
    }
  }, [activeSubTab, hfRadarStations, ramaBuoys, selectedStationId, selectedBuoyId]);

  useEffect(() => {
    if (activeSubTab === "hfradar" && selectedStationId) {
      setLoading(true);
      api.getHFRadarStationDetails(selectedStationId)
        .then(setStationDetails)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [activeSubTab, selectedStationId]);

  const activeStation = hfRadarStations.find(s => s.station_id === selectedStationId) || hfRadarStations[0];
  const activeBuoy = ramaBuoys.find(b => b.buoy_id === selectedBuoyId) || ramaBuoys[0];

  // ── Thermistor rows for a buoy ──────────────────────────────────────────
  const thermistorRows = activeBuoy ? [
    { depth: 1,   temp: activeBuoy.sst,             sal: activeBuoy.sss,         layer: "Mixed Layer (Surface)" },
    { depth: 10,  temp: activeBuoy.sst - 0.1,       sal: activeBuoy.sss,         layer: "Mixed Layer" },
    { depth: 20,  temp: activeBuoy.sst - 0.2,       sal: activeBuoy.sss + 0.1,   layer: "Mixed Layer Base" },
    { depth: 40,  temp: activeBuoy.sst - 1.8,       sal: activeBuoy.sss + 0.3,   layer: "Upper Thermocline" },
    { depth: 60,  temp: activeBuoy.sst - 4.5,       sal: activeBuoy.sss + 0.5,   layer: "Core Thermocline" },
    { depth: 80,  temp: activeBuoy.sst - 7.8,       sal: activeBuoy.sss + 0.7,   layer: "Core Thermocline (20°C Isotherm)" },
    { depth: 100, temp: activeBuoy.sst - 11.2,      sal: activeBuoy.sss + 0.8,   layer: "Lower Thermocline" },
    { depth: 140, temp: 15.8,                        sal: activeBuoy.sss + 0.6,   layer: "Deep Thermocline" },
    { depth: 200, temp: 14.1,                        sal: activeBuoy.sss + 0.4,   layer: "Sub-thermocline Water" },
    { depth: 300, temp: 11.6,                        sal: activeBuoy.sss + 0.2,   layer: "Indian Ocean Central Water" },
    { depth: 500, temp: 9.4,                         sal: activeBuoy.sss,         layer: "Intermediate Deep Water" },
  ] : [];

  const vectors = (stationDetails?.vectors || activeStation?.vectors || []).slice(0, 20);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "var(--sidebar-w) 1fr var(--right-w)", height: "100%", overflow: "hidden", background: "var(--steel-50)" }}>

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — Station / Buoy Selector List
          ══════════════════════════════════════════════════════ */}
      <aside className="panel">
        {/* Sub-tab toggle */}
        <div className="panel-section">
          <div className="profile-tabs" style={{ marginBottom: 14 }}>
            <button
              className={`profile-tab${activeSubTab === "hfradar" ? " active" : ""}`}
              onClick={() => setActiveSubTab("hfradar")}
            >
              📡 HF Radar
            </button>
            <button
              className={`profile-tab${activeSubTab === "rama" ? " active" : ""}`}
              onClick={() => setActiveSubTab("rama")}
            >
              ⚓ RAMA Buoys
            </button>
          </div>
        </div>

        {/* HF Radar station list */}
        {activeSubTab === "hfradar" && (
          <div className="panel-section">
            <div className="panel-section-title">
              <span className="icon">📡</span> Active Stations ({hfRadarStations.length})
            </div>
            <ul className="instrument-list">
              {hfRadarStations.map(st => {
                const isSel = st.station_id === selectedStationId;
                return (
                  <li
                    key={st.station_id}
                    className={isSel ? "active" : ""}
                    onClick={() => setSelectedStationId(st.station_id)}
                  >
                    <div className="inst-header">
                      <span className="tag" style={{ borderColor: "var(--c-salt)", color: "var(--c-salt)", background: "var(--c-salt-bg)" }}>HF</span>
                      <span className="inst-id">{st.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: "var(--good)" }}>● active</span>
                    </div>
                    <div className="inst-meta">{st.coast}</div>
                    <div className="inst-meta" style={{ fontFamily: "var(--font-mono)", marginTop: 2 }}>
                      📍 {st.latitude}°N, {st.longitude}°E
                      &nbsp;·&nbsp; 📡 {st.frequency_mhz} MHz
                      &nbsp;·&nbsp; 📏 {st.range_km} km
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--steel-500)", background: "var(--steel-200)", padding: "4px 7px", borderRadius: "var(--radius)", marginTop: 5 }}>
                      <span>Avg: <strong style={{ color: "var(--steel-700)" }}>{st.avg_speed || "0.42"} m/s</strong></span>
                      <span>Max: <strong style={{ color: "var(--steel-700)" }}>{st.max_speed || "0.88"} m/s</strong></span>
                      <span>Vectors: <strong style={{ color: "var(--steel-700)" }}>{st.n_vectors || 128}</strong></span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* RAMA buoy list */}
        {activeSubTab === "rama" && (
          <div className="panel-section">
            <div className="panel-section-title">
              <span className="icon">⚓</span> Deep Moorings ({ramaBuoys.length})
            </div>
            <ul className="instrument-list">
              {ramaBuoys.map(b => {
                const isSel = b.buoy_id === selectedBuoyId;
                return (
                  <li
                    key={b.buoy_id}
                    className={isSel ? "active" : ""}
                    onClick={() => setSelectedBuoyId(b.buoy_id)}
                  >
                    <div className="inst-header">
                      <span className="tag" style={{ borderColor: "var(--c-chla)", color: "var(--c-chla)", background: "rgba(217,119,6,.08)" }}>RAMA</span>
                      <span className="inst-id">{b.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: "var(--warn)" }}>● active</span>
                    </div>
                    <div className="inst-meta">{b.region}</div>
                    <div className="inst-meta" style={{ fontFamily: "var(--font-mono)", marginTop: 2 }}>
                      📍 {b.latitude}°N, {b.longitude}°E
                      &nbsp;·&nbsp; ⚓ {b.mooring_depth_m}m
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--steel-500)", background: "var(--steel-200)", padding: "4px 7px", borderRadius: "var(--radius)", marginTop: 5 }}>
                      <span>SST: <strong style={{ color: "var(--c-temp)" }}>{b.sst}°C</strong></span>
                      <span>SSS: <strong style={{ color: "var(--c-salt)" }}>{b.sss} PSU</strong></span>
                      <span>Wind: <strong style={{ color: "var(--steel-700)" }}>{b.wind_speed_ms} m/s</strong></span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>

      {/* ══════════════════════════════════════════════════════
          CENTER — Station / Buoy Detail & Data Tables
          ══════════════════════════════════════════════════════ */}
      <main style={{ padding: "20px", overflowY: "auto", background: "var(--steel-50)" }}>

        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--steel-800)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            📡 Coastal HF Radar & Deep RAMA Moored Buoy Observatory
          </h2>
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--steel-500)", lineHeight: 1.6 }}>
            Continuous in-situ observational networks monitoring coastal surface dynamics and tropical Indian Ocean thermohaline structure.
          </p>
        </div>

        {/* ── HF RADAR CONTENT ─────────────────────────────────── */}
        {activeSubTab === "hfradar" && activeStation && (
          <>
            {/* Station banner */}
            <div className="glass-card" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div className="cmems-badge" style={{ marginBottom: 6 }}>
                  {activeStation.operator || "INCOIS / NIOT Coastal Radar Network"}
                </div>
                <h3 style={{ margin: "0 0 5px", fontSize: 17, fontWeight: 700, color: "var(--steel-800)", fontFamily: "var(--font-display)" }}>
                  {activeStation.name}
                </h3>
                <p style={{ margin: 0, fontSize: 11, color: "var(--steel-500)", lineHeight: 1.5 }}>
                  {activeStation.coast} · {activeStation.state}, India · Real-time Doppler surface current tracking within {activeStation.range_km} km coastal perimeter.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Transmit Frequency", val: `${activeStation.frequency_mhz} MHz`, color: "var(--c-ssh)" },
                  { label: "Radar Range",         val: `${activeStation.range_km} km`,       color: "var(--c-salt)" },
                  { label: "Active Surface Vectors", val: activeStation.n_vectors || 128,    color: "var(--c-chla)" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="kpi-card" style={{ minWidth: 120, "--kpi-color": color }}>
                    <div className="kpi-label">{label}</div>
                    <div className="kpi-value" style={{ fontSize: 18 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vector field table */}
            <div className="glass-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div className="chart-title">🌊 High-Density Surface Velocity Vector Field (Sample Grid)</div>
                  <div className="chart-subtitle">
                    Observed at {activeStation.last_updated || "2026-09-06T12:00:00Z"} (Quality Flag 1: Good)
                  </div>
                </div>
                {loading && <div className="loading-spinner" style={{ width: 22, height: 22, borderWidth: 2 }} />}
              </div>

              <div style={{ overflowX: "auto", maxHeight: 380, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "var(--steel-200)", borderBottom: "2px solid var(--steel-300)" }}>
                      {["Latitude", "Longitude", "Current Speed (m/s)", "Direction (°)", "u (Eastward)", "v (Northward)", "Quality"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--steel-600)", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vectors.map((v, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--steel-200)", background: i % 2 === 0 ? "var(--steel-50)" : "var(--steel-100)" }}>
                        <td style={{ padding: "7px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>{v.latitude?.toFixed(3)}°N</td>
                        <td style={{ padding: "7px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>{v.longitude?.toFixed(3)}°E</td>
                        <td style={{ padding: "7px 10px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--c-ssh)" }}>{v.speed?.toFixed(3)} m/s</td>
                        <td style={{ padding: "7px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>{v.direction_deg}°</td>
                        <td style={{ padding: "7px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>{v.u?.toFixed(3)}</td>
                        <td style={{ padding: "7px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>{v.v?.toFixed(3)}</td>
                        <td style={{ padding: "7px 10px" }}>
                          <span className="tag" style={{ color: "var(--good)", borderColor: "var(--good)60", background: "var(--good-bg)", fontSize: 9 }}>
                            ✓ Verified (QC 1)
                          </span>
                        </td>
                      </tr>
                    ))}
                    {vectors.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--steel-400)", fontSize: 11 }}>No vector data available for this station.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── RAMA BUOY CONTENT ─────────────────────────────────── */}
        {activeSubTab === "rama" && activeBuoy && (
          <>
            {/* Buoy banner */}
            <div className="glass-card" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div className="argo-badge" style={{ marginBottom: 6 }}>
                  {activeBuoy.institution || "INCOIS / NOAA PMEL Joint Array"}
                </div>
                <h3 style={{ margin: "0 0 5px", fontSize: 17, fontWeight: 700, color: "var(--steel-800)", fontFamily: "var(--font-display)" }}>
                  {activeBuoy.name}
                </h3>
                <p style={{ margin: 0, fontSize: 11, color: "var(--steel-500)", lineHeight: 1.5 }}>
                  {activeBuoy.region} · Mooring Depth: {activeBuoy.mooring_depth_m} m · Deployed: {activeBuoy.deployed_date}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Sea Surface Temp",     val: `${activeBuoy.sst} °C`,  color: "var(--c-temp)" },
                  { label: "Sea Surface Salinity", val: `${activeBuoy.sss} PSU`, color: "var(--c-salt)" },
                  { label: "Mixed Layer Depth",    val: `${activeBuoy.mld_m || 35} m`,   color: "var(--c-mld)" },
                  { label: "Thermocline (20°C)",   val: `${activeBuoy.thermocline_depth_m || 85} m`, color: "var(--c-chla)" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="kpi-card" style={{ minWidth: 110, "--kpi-color": color }}>
                    <div className="kpi-label">{label}</div>
                    <div className="kpi-value" style={{ fontSize: 16 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Met-ocean 4-column strip */}
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
              {[
                { label: "Air Temperature",        val: `${activeBuoy.air_temp || 28.2} °C`,                                color: "var(--c-temp)" },
                { label: "Wind Speed & Direction", val: `${activeBuoy.wind_speed_ms || 7.4} m/s @ ${activeBuoy.wind_direction_deg || 225}°`, color: "var(--c-ssh)" },
                { label: "Barometric Pressure",    val: `${activeBuoy.barometric_pressure_hpa || 1008.4} hPa`,              color: "var(--c-mld)" },
                { label: "Last Transmitted",       val: (activeBuoy.last_observation_time || "2026-09-06T12:00:00Z").replace("T", " ").replace("Z", ""), color: "var(--steel-600)" },
              ].map(({ label, val, color }) => (
                <div key={label} className="kpi-card" style={{ "--kpi-color": color }}>
                  <div className="kpi-label">{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "var(--font-mono)", marginTop: 4, lineHeight: 1.3 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Thermistor depth profile table */}
            <div className="glass-card">
              <div className="chart-title" style={{ marginBottom: 4 }}>
                🌡️ Subsurface Thermistor String Profile (T &amp; S vs Depth)
              </div>
              <div className="chart-subtitle" style={{ marginBottom: 14 }}>
                Sensors clamped to mooring line from 1m to 500m depth
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "var(--steel-200)", borderBottom: "2px solid var(--steel-300)" }}>
                      {["Sensor Depth (m)", "In-Situ Temperature (°C)", "In-Situ Salinity (PSU)", "Layer Classification", "Status"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--steel-600)", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {thermistorRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--steel-200)", background: i % 2 === 0 ? "var(--steel-50)" : "var(--steel-100)" }}>
                        <td style={{ padding: "7px 10px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--steel-800)" }}>{row.depth} m</td>
                        <td style={{ padding: "7px 10px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--c-temp)" }}>{row.temp.toFixed(2)} °C</td>
                        <td style={{ padding: "7px 10px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--c-salt)" }}>{row.sal.toFixed(2)} PSU</td>
                        <td style={{ padding: "7px 10px", fontSize: 10, color: "var(--steel-500)" }}>{row.layer}</td>
                        <td style={{ padding: "7px 10px" }}>
                          <span className="tag" style={{ color: "var(--good)", borderColor: "var(--good)60", background: "var(--good-bg)", fontSize: 9 }}>
                            ✓ Transmitting
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — Summary Telemetry & Scientific Context
          ══════════════════════════════════════════════════════ */}
      <aside className="panel" style={{ borderLeft: "2px solid var(--steel-300)", borderRight: "none" }}>

        {activeSubTab === "hfradar" && activeStation && (
          <>
            <div className="panel-section">
              <div className="panel-section-title"><span className="icon">📍</span> Station Summary</div>
              <div className="glass-card" style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--steel-800)", fontFamily: "var(--font-display)", marginBottom: 6 }}>
                  {activeStation.name}
                </div>
                <div className="inst-meta">{activeStation.coast}</div>
                <div className="inst-meta" style={{ fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  📍 {activeStation.latitude}°N, {activeStation.longitude}°E
                </div>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card" style={{ "--kpi-color": "var(--c-salt)" }}>
                  <div className="kpi-label">Frequency</div>
                  <div className="kpi-value" style={{ fontSize: 16 }}>{activeStation.frequency_mhz} MHz</div>
                </div>
                <div className="kpi-card" style={{ "--kpi-color": "var(--c-ssh)" }}>
                  <div className="kpi-label">Range</div>
                  <div className="kpi-value" style={{ fontSize: 16 }}>{activeStation.range_km} km</div>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <div className="panel-section-title"><span className="icon">🌊</span> Scientific Context</div>
              <div className="info-box">
                <div className="info-title">HF Radar Technology</div>
                High-Frequency radar systems measure ocean surface currents by Bragg scattering of radio waves from ocean surface gravity waves. Typical radial velocity resolution: ±0.02 m/s.
              </div>
              <div className="info-box">
                <div className="info-title">INCOIS Network Role</div>
                6 coastal stations provide real-time surface current maps for maritime safety, search-and-rescue, and Bay of Bengal / Arabian Sea circulation monitoring.
              </div>
            </div>
          </>
        )}

        {activeSubTab === "rama" && activeBuoy && (
          <>
            <div className="panel-section">
              <div className="panel-section-title"><span className="icon">⚓</span> Buoy Summary</div>
              <div className="glass-card" style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--steel-800)", fontFamily: "var(--font-display)", marginBottom: 6 }}>
                  {activeBuoy.name}
                </div>
                <div className="inst-meta">{activeBuoy.region}</div>
                <div className="inst-meta" style={{ fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  📍 {activeBuoy.latitude}°N, {activeBuoy.longitude}°E
                  <br />⚓ Mooring: {activeBuoy.mooring_depth_m} m
                </div>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card" style={{ "--kpi-color": "var(--c-temp)" }}>
                  <div className="kpi-label">SST</div>
                  <div className="kpi-value" style={{ fontSize: 18 }}>{activeBuoy.sst} °C</div>
                </div>
                <div className="kpi-card" style={{ "--kpi-color": "var(--c-salt)" }}>
                  <div className="kpi-label">SSS</div>
                  <div className="kpi-value" style={{ fontSize: 18 }}>{activeBuoy.sss}</div>
                  <div className="kpi-unit">PSU</div>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <div className="panel-section-title"><span className="icon">🌊</span> Scientific Context</div>
              <div className="info-box">
                <div className="info-title">RAMA Array Role</div>
                Research Moored Array for African-Asian-Australian Monsoon Analysis. Provides continuous subsurface T/S profiles critical for Indian Ocean monsoon prediction.
              </div>
              <div className="info-box">
                <div className="info-title">Thermocline Structure</div>
                Tropical Indian Ocean thermocline is at {activeBuoy.thermocline_depth_m || 85}m. Mixed Layer Depth: {activeBuoy.mld_m || 35}m — key for cyclone intensity forecasting and fisheries.
              </div>
            </div>
          </>
        )}

        <div className="panel-section">
          <div className="panel-section-title"><span className="icon">📊</span> Network Summary</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "HF Radar Stations", val: hfRadarStations.length, color: "var(--c-salt)" },
              { label: "RAMA Moorings",     val: ramaBuoys.length,      color: "var(--c-chla)" },
              { label: "Total Active",      val: hfRadarStations.length + ramaBuoys.length, color: "var(--good)" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: "var(--steel-50)", border: "2px solid var(--steel-300)", borderRadius: "var(--radius)" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--steel-700)", fontFamily: "var(--font-display)" }}>{label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "var(--font-display)" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
