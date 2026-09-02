import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { api } from "./api.js";
import { paletteForVariable, paletteGradientCss, varColor } from "./utils/colormap.js";

import ControlPanel from "./components/ControlPanel.jsx";
import OceanMap from "./components/OceanMap.jsx";
import Scene3D from "./components/Scene3D.jsx";
import ProfilePanel from "./components/ProfileChart.jsx";
import StatsDashboard from "./components/StatsDashboard.jsx";

export default function App() {
  // ── API / dataset state ──────────────────────────────────────────────────
  const [apiOnline, setApiOnline] = useState(null);
  const [meta, setMeta] = useState(null);
  const [dates, setDates] = useState([]);

  // ── Active selection state ───────────────────────────────────────────────
  const [variable, setVariable] = useState("tob");
  const [dateIndex, setDateIndex] = useState(600);
  const [isPlaying, setIsPlaying] = useState(false);

  // ── Display settings ─────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState("map"); // "map" | "3d"
  const [activeTab, setActiveTab] = useState("viz"); // "viz" | "analytics" | "argo"
  const [verticalExaggeration, setVerticalExaggeration] = useState(1.5);
  const [layerOpacity, setLayerOpacity] = useState(0.85);
  const [palette, setPalette] = useState("thermal");
  const [colorScale, setColorScale] = useState("linear");
  const [colorRange, setColorRange] = useState(null);

  // ── CMEMS surface data ───────────────────────────────────────────────────
  const [surface, setSurface] = useState(null);
  const [surfaceLoading, setSurfaceLoading] = useState(false);

  // ── Real Argo float state ────────────────────────────────────────────────
  const [instruments, setInstruments] = useState([]);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [allTrajectories, setAllTrajectories] = useState([]);

  // ── Map click / CMEMS time-series ───────────────────────────────────────
  const [clickedPoint, setClickedPoint] = useState(null);
  const [timeSeries, setTimeSeries] = useState(null);
  const [tsLoading, setTsLoading] = useState(false);

  // ── Hover state ──────────────────────────────────────────────────────────
  const [hoverInfo, setHoverInfo] = useState(null);

  const playTimer = useRef(null);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.health()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    api.getVariables()
      .then((m) => {
        setMeta(m);
        if (m.variables?.length > 0) setVariable(m.variables[0].name);
      })
      .catch(console.error);

    api.getDates()
      .then((d) => {
        setDates(d.dates || []);
        setDateIndex(Math.min(600, (d.dates?.length || 1) - 1));
      })
      .catch(console.error);

    // Load real Argo floats from NC files
    api.getInstruments()
      .then(setInstruments)
      .catch(console.error);

    // Load all float trajectories for map overlay
    api.getAllTrajectories()
      .then(setAllTrajectories)
      .catch(console.error);
  }, []);

  // ── Auto-select palette when variable changes ────────────────────────────
  useEffect(() => {
    setPalette(paletteForVariable(variable));
    setColorRange(null);
  }, [variable]);

  // ── Fetch CMEMS surface data whenever variable/date changes ─────────────
  useEffect(() => {
    if (!dates.length || !variable) return;
    const date = dates[dateIndex];
    if (!date) return;

    setSurfaceLoading(true);
    api.getSurface(variable, date, 4)
      .then((s) => {
        setSurface(s);
        if (colorRange === null) {
          setColorRange({ min: s.min_value, max: s.max_value });
        }
      })
      .catch(console.error)
      .finally(() => setSurfaceLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable, dateIndex, dates]);

  // ── Time animation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !dates.length) return;
    playTimer.current = setInterval(() => {
      setDateIndex((i) => (i + 1) % dates.length);
    }, 1200);
    return () => clearInterval(playTimer.current);
  }, [isPlaying, dates]);

  // ── Argo float profile fetch (with CMEMS co-location) ───────────────────
  useEffect(() => {
    if (!selectedInstrumentId) return;
    setProfileLoading(true);
    api.getProfile(selectedInstrumentId, variable)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, [selectedInstrumentId, variable]);

  // ── CMEMS click → time-series fetch ─────────────────────────────────────
  const handleMapClick = useCallback((lat, lon) => {
    setClickedPoint({ lat, lon });
    setTsLoading(true);
    api.getTimeSeries(variable, lat, lon)
      .then(setTimeSeries)
      .catch(console.error)
      .finally(() => setTsLoading(false));
  }, [variable]);

  const handleHover = useCallback((lat, lon, value) => {
    setHoverInfo({ lat, lon, value });
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────
  const activeVarInfo = useMemo(
    () => meta?.variables.find((v) => v.name === variable),
    [meta, variable]
  );
  const currentDate = dates[dateIndex] ?? meta?.time_start ?? "";
  const vc = varColor(variable);

  return (
    <div className="app-shell">
      {/* ═══════════════════════════════════════════════════════
          TOP BAR
          ═══════════════════════════════════════════════════════ */}
      <header className="topbar">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">🌊</div>
          <div className="brand-text">
            <h1>SAGAR<span className="accent">-DRISHTI</span></h1>
            <div className="subtitle">सागर-दृष्टि · Ocean Vision · SIH 26067 · INCOIS</div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="topbar-tabs">
          <button
            className={`topbar-tab${activeTab === "viz" ? " active" : ""}`}
            onClick={() => setActiveTab("viz")}
          >
            🌐 Visualization
          </button>
          <button
            className={`topbar-tab${activeTab === "argo" ? " active" : ""}`}
            onClick={() => setActiveTab("argo")}
          >
            🔴 Argo Explorer
          </button>
          <button
            className={`topbar-tab${activeTab === "analytics" ? " active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            📊 Analytics
          </button>
        </nav>

        {/* Right side info */}
        <div className="topbar-right">
          <div className="dataset-badge">
            <div className="dot" />
            <strong>CMEMS</strong> + <strong style={{ color: "var(--c-chla)" }}>Argo NC</strong>
            &nbsp;·&nbsp;{dates.length} days
            &nbsp;·&nbsp;{instruments.length} floats
          </div>
          <div className={`status-pill${apiOnline === false ? " offline" : ""}`}>
            {apiOnline === null
              ? "Connecting…"
              : apiOnline
              ? "API Online"
              : "API Offline — start backend"}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          ANALYTICS TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <main style={{ height: "100%", overflow: "hidden" }}>
          <StatsDashboard meta={meta} variable={variable} date={currentDate} />
        </main>
      )}

      {/* ═══════════════════════════════════════════════════════
          ARGO EXPLORER TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "argo" && (
        <main style={{ height: "100%", overflow: "hidden" }}>
          <ArgoExplorer
            instruments={instruments}
            allTrajectories={allTrajectories}
            selectedId={selectedInstrumentId}
            onSelect={setSelectedInstrumentId}
            profile={profile}
            profileLoading={profileLoading}
            variable={variable}
          />
        </main>
      )}

      {/* ═══════════════════════════════════════════════════════
          VISUALIZATION TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "viz" && (
        <main className="main-layout">
          {/* Left panel — CMEMS controls */}
          <ControlPanel
            meta={meta}
            variable={variable}
            onVariableChange={(v) => { setIsPlaying(false); setVariable(v); }}
            dateIndex={dateIndex}
            onDateIndexChange={(i) => { setIsPlaying(false); setDateIndex(i); }}
            dates={dates}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            verticalExaggeration={verticalExaggeration}
            onVerticalExaggerationChange={setVerticalExaggeration}
            layerOpacity={layerOpacity}
            onLayerOpacityChange={setLayerOpacity}
            palette={palette}
            onPaletteChange={setPalette}
            colorMin={colorRange?.min ?? 0}
            colorMax={colorRange?.max ?? 1}
            onRangeChange={(min, max) => setColorRange({ min, max })}
            colorScale={colorScale}
            onColorScaleChange={setColorScale}
            activeVarInfo={activeVarInfo}
            viewMode={viewMode}
          />

          {/* Center viewport */}
          <div className="viewport">
            {/* Initial loading overlay — only shown before first data arrives */}
            {surfaceLoading && !surface && (
              <div className="viewport-loading">
                <div className="loading-spinner" />
                <div className="loading-text">Loading Copernicus Marine data…</div>
              </div>
            )}

            {/* 2D choropleth map (always mounted so Leaflet base map shows immediately) */}
            {viewMode === "map" && (
              <OceanMap
                surface={surface || null}
                palette={palette}
                colorMin={colorRange?.min}
                colorMax={colorRange?.max}
                colorScale={colorScale}
                onPointClick={handleMapClick}
                onHover={handleHover}
                instruments={instruments}
                onSelectInstrument={setSelectedInstrumentId}
                selectedInstrumentId={selectedInstrumentId}
              />
            )}

            {/* View mode toggle — bottom-right so it doesn't clash with Leaflet zoom */}
            <div className="view-toggle" style={{ top: "auto", bottom: 14, right: 14 }}>
              <button
                className={`view-toggle-btn${viewMode === "map" ? " active" : ""}`}
                onClick={() => setViewMode("map")}
              >
                🗺️ Map
              </button>
              <button
                className={`view-toggle-btn${viewMode === "3d" ? " active" : ""}`}
                onClick={() => setViewMode("3d")}
              >
                🌐 3D
              </button>
            </div>

            {/* Coordinate / hover info — top-left, above Leaflet layers */}
              {hoverInfo && viewMode === "map" && (
              <div className="coord-info" style={{ zIndex: 500 }}>
                <strong>{hoverInfo.lat?.toFixed(3)}°N &nbsp; {hoverInfo.lon?.toFixed(3)}°E</strong>
                &nbsp;·&nbsp;
                {hoverInfo.value != null
                  ? <span style={{ color: vc, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{hoverInfo.value.toFixed(3)}</span>
                  : "—"}
                &nbsp;{activeVarInfo?.units}
              </div>
            )}

            {/* 3D terrain perspective */}
            {viewMode === "3d" && surface && (
              <Scene3D
                surface={surface}
                palette={palette}
                colorScale={colorScale}
                colorMin={colorRange?.min}
                colorMax={colorRange?.max}
                verticalExaggeration={verticalExaggeration}
                instruments={instruments}
                onSelectInstrument={setSelectedInstrumentId}
                selectedInstrumentId={selectedInstrumentId}
              />
            )}

            {/* Loading indicator while refreshing */}
            {surfaceLoading && surface && (
              <div style={{
                position: "absolute", top: 10, right: 10,
                background: "var(--steel-100)", border: "2px solid var(--steel-300)",
                borderRadius: "var(--radius)", padding: "7px 13px", fontSize: 10.5,
                color: "var(--steel-600)",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "var(--shadow-hard-sm)"
              }}>
                <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Updating CMEMS…
              </div>
            )}

            {/* Bottom colorbar legend */}
            {activeVarInfo && colorRange && (
              <div className="legend">
                <div className="legend-title">
                  <span style={{ color: vc }}>{activeVarInfo.icon} {activeVarInfo.long_name}</span>
                  &nbsp;·&nbsp;
                  <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 10 }}>{currentDate}</span>
                </div>
                <div
                  className="legend-bar"
                  style={{ background: paletteGradientCss(palette) }}
                />
                <div className="legend-scale">
                  <span>{colorRange.min.toFixed(2)}</span>
                  <span style={{ color: vc }}>{activeVarInfo.units}</span>
                  <span>{colorRange.max.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Bottom hint */}
            <div className="hint-overlay">
              {viewMode === "map"
                ? "Hover for CMEMS values · Click for time-series · Click 🔴 for Argo profiles"
                : "Drag to rotate · Scroll to zoom · Click 🔴 markers for Argo depth profiles"}
            </div>
          </div>

          {/* Right panel — Argo floats + time-series */}
          <ProfilePanel
            instruments={instruments}
            selectedId={selectedInstrumentId}
            onSelect={setSelectedInstrumentId}
            profile={profile}
            timeSeries={timeSeries}
            timeSeriesPoint={clickedPoint}
            loading={profileLoading || tsLoading}
            variable={variable}
          />
        </main>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Argo Explorer Tab — dedicated float exploration view
   ═══════════════════════════════════════════════════════ */
function ArgoExplorer({ instruments, allTrajectories, selectedId, onSelect, profile, profileLoading, variable }) {
  // Compute summary stats
  const bgcFloats = instruments.filter(i => i.bgc_params?.length > 0);
  const allParams = [...new Set(instruments.flatMap(i => i.bgc_params || []))];

  return (
    <div className="argo-layout">
      {/* Sidebar */}
      <div className="argo-sidebar">
        <div className="argo-header-card">
          <div className="argo-title">🔴 Argo Float Explorer</div>
          <div className="argo-subtitle">
            Real in-situ profiles · Coriolis DataSelection Export<br />
            Jun 2025 – Aug 2026 · Bay of Bengal & Arabian Sea
          </div>
        </div>

        {/* Summary stats */}
        <div className="float-stat-row">
          <div className="float-stat">
            <span className="float-stat-value">{instruments.length}</span>
            <div className="float-stat-label">Total Floats</div>
          </div>
          <div className="float-stat">
            <span className="float-stat-value" style={{ color: "var(--c-doxy)" }}>{bgcFloats.length}</span>
            <div className="float-stat-label">BGC Floats</div>
          </div>
          <div className="float-stat">
            <span className="float-stat-value" style={{ color: "var(--c-chla)" }}>{allTrajectories.length}</span>
            <div className="float-stat-label">Trajectories</div>
          </div>
          <div className="float-stat">
            <span className="float-stat-value" style={{ color: "var(--c-ssh)" }}>{allParams.length}</span>
            <div className="float-stat-label">Param Types</div>
          </div>
        </div>

        {/* Available BGC parameters */}
        <div className="panel-section">
          <div className="panel-section-title"><span className="icon">🔬</span> Available Parameters</div>
          <div className="param-badges" style={{ gap: 5 }}>
            {["TEMP","PSAL","DOXY","CHLA","NITRATE","PH_IN_SITU_TOTAL","BBP700"].map((p) => {
              const count = instruments.filter(i => i.available_params?.includes(p)).length;
              const colors = { TEMP:"#ff6b6b",PSAL:"#4ecdc4",DOXY:"#55efc4",CHLA:"#fdcb6e",NITRATE:"#a29bfe",PH_IN_SITU_TOTAL:"#fd79a8",BBP700:"#e17055" };
              const c = colors[p] || "#00d4f0";
              if (count === 0) return null;
              return (
                <div key={p} style={{
                  padding: "5px 10px", borderRadius: 7, fontSize: 10,
                  background: `${c}15`, border: `1px solid ${c}33`,
                  color: c, fontWeight: 600, fontFamily: "var(--font-mono)",
                  display: "flex", alignItems: "center", gap: 5
                }}>
                  {p.replace("_IN_SITU_TOTAL", "")}
                  <span style={{ color: "var(--muted)", fontFamily: "var(--font-body)", fontWeight: 400 }}>
                    ×{count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Float list */}
        <div className="panel-section">
          <div className="panel-section-title"><span className="icon">📡</span> Select Float</div>
          <ul className="instrument-list">
            {instruments.map((inst) => (
              <li
                key={inst.instrument_id}
                className={inst.instrument_id === selectedId ? "active" : ""}
                onClick={() => onSelect(inst.instrument_id)}
              >
                <div className="inst-header">
                  <span className="tag argo">ARGO</span>
                  {inst.bgc_params?.length > 0 && <span className="tag bgc">BGC</span>}
                  <span className="inst-id">{inst.platform_number}</span>
                </div>
                <div className="inst-meta">
                  {inst.latitude?.toFixed(2)}°N, {inst.longitude?.toFixed(2)}°E
                  &nbsp;·&nbsp;{inst.timestamp?.slice(0, 10)}
                </div>
                <div className="param-badges">
                  {(inst.bgc_params || []).map((p) => {
                    const colors = { DOXY:"#55efc4",CHLA:"#fdcb6e",NITRATE:"#a29bfe",PH_IN_SITU_TOTAL:"#fd79a8",BBP700:"#e17055" };
                    const c = colors[p] || "var(--accent)";
                    return <span key={p} className="param-badge" style={{ color: c, borderColor: `${c}33` }}>{p.replace("_IN_SITU_TOTAL","")}</span>;
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div className="argo-main">
        {!selectedId && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: "60%", color: "var(--steel-500)", textAlign: "center", gap: 16
          }}>
            <div style={{ fontSize: 48, opacity: 0.35 }}>🔴</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--steel-700)", letterSpacing: "-0.02em" }}>
              Select a Float
            </div>
            <div style={{ fontSize: 12, maxWidth: 360, lineHeight: 1.7, color: "var(--steel-500)" }}>
              Choose an Argo float from the sidebar to view its multi-parameter depth profile,
              T-S diagram, and CMEMS model comparison.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <span className="cmems-badge">🛰️ CMEMS Model Fields</span>
              <span className="argo-badge">🔴 Real Argo Profiles</span>
            </div>
          </div>
        )}

        {selectedId && (
          <ProfilePanel
            instruments={instruments}
            selectedId={selectedId}
            onSelect={onSelect}
            profile={profile}
            timeSeries={null}
            timeSeriesPoint={null}
            loading={profileLoading}
            variable={variable}
          />
        )}
      </div>
    </div>
  );
}
