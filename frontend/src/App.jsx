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
  const [volumetricMeta, setVolumetricMeta] = useState(null);
  const [dates, setDates] = useState([]);

  // ── Active selection state ───────────────────────────────────────────────
  const [datasetMode, setDatasetMode] = useState("cmems"); // "cmems" | "volumetric"
  const [variable, setVariable] = useState("tob");
  const [dateIndex, setDateIndex] = useState(600);
  const [depthIndex, setDepthIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // ── Display settings ─────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState("map"); // "map" | "3d"
  const [activeTab, setActiveTab] = useState("viz"); // "viz" | "analytics" | "argo"
  const [verticalExaggeration, setVerticalExaggeration] = useState(1.5);
  const [layerOpacity, setLayerOpacity] = useState(0.85);
  const [palette, setPalette] = useState("thermal");
  const [colorScale, setColorScale] = useState("linear");
  const [colorRange, setColorRange] = useState(null);

  // ── Tier 2 Dynamics & Isosurface state ───────────────────────────────────
  const [showCurrents, setShowCurrents] = useState(false);
  const [currentVectors, setCurrentVectors] = useState(null);
  const [showIsosurface, setShowIsosurface] = useState(false);
  const [isovalue, setIsovalue] = useState(28.0);
  const [isosurfaceGrid, setIsosurfaceGrid] = useState(null);

  // ── Surface & Depth slice data ───────────────────────────────────────────
  const [surface, setSurface] = useState(null);
  const [surfaceLoading, setSurfaceLoading] = useState(false);

  // ── In-situ platforms: Argo + Gliders ────────────────────────────────────
  const [instruments, setInstruments] = useState([]);
  const [gliders, setGliders] = useState([]);
  const [selectedInstrumentId, setSelectedInstrumentId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [allTrajectories, setAllTrajectories] = useState([]);

  // ── Map click / time-series ─────────────────────────────────────────────
  const [clickedPoint, setClickedPoint] = useState(null);
  const [timeSeries, setTimeSeries] = useState(null);
  const [tsLoading, setTsLoading] = useState(false);

  // ── Hover state ──────────────────────────────────────────────────────────
  const [hoverInfo, setHoverInfo] = useState(null);

  const playTimer = useRef(null);

  // ── Compute active date list based on dataset mode ───────────────────────
  const activeDates = useMemo(() => {
    if (datasetMode === "volumetric") {
      return volumetricMeta?.dates || ["2026-08-31"];
    }
    return dates.length ? dates : ["2024-01-01"];
  }, [datasetMode, volumetricMeta, dates]);

  const safeDateIndex = Math.min(dateIndex, Math.max(0, activeDates.length - 1));
  const currentDate = activeDates[safeDateIndex] || "2026-08-31";

  // ── Initial Bootstrap ────────────────────────────────────────────────────
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

    api.getVolumetricMeta()
      .then(setVolumetricMeta)
      .catch(console.error);

    api.getDates()
      .then((d) => {
        setDates(d.dates || []);
        setDateIndex(Math.min(600, (d.dates?.length || 1) - 1));
      })
      .catch(console.error);

    api.getInstruments()
      .then(setInstruments)
      .catch(console.error);

    api.getGliders()
      .then(setGliders)
      .catch(console.error);

    api.getAllTrajectories()
      .then(setAllTrajectories)
      .catch(console.error);
  }, []);

  // ── Switch active variable list when dataset mode switches ────────────────
  const handleDatasetModeChange = (mode) => {
    setDatasetMode(mode);
    setDateIndex(0);
    if (mode === "volumetric") {
      setVariable("temperature");
      setPalette("thermal");
      setColorRange(null);
    } else {
      setVariable("tob");
      setPalette("thermal");
      setColorRange(null);
    }
  };

  // ── Fetch surface or depth slice data ────────────────────────────────────
  useEffect(() => {
    if (!variable) return;
    const date = currentDate;

    setSurfaceLoading(true);

    if (datasetMode === "volumetric") {
      const depthVal = volumetricMeta?.depth_levels?.[depthIndex] ?? 0;
      api.getDepthSlice(variable, date, depthVal, 1)
        .then((s) => {
          setSurface(s);
          if (colorRange === null && s) {
            setColorRange({ min: s.min_value, max: s.max_value });
          }
        })
        .catch(console.error)
        .finally(() => setSurfaceLoading(false));
    } else {
      api.getSurface(variable, date, 4)
        .then((s) => {
          setSurface(s);
          if (colorRange === null && s) {
            setColorRange({ min: s.min_value, max: s.max_value });
          }
        })
        .catch(console.error)
        .finally(() => setSurfaceLoading(false));
    }
  }, [datasetMode, variable, currentDate, depthIndex, volumetricMeta]);

  // ── Fetch Current Vectors when toggled ───────────────────────────────────
  useEffect(() => {
    if (!showCurrents) {
      setCurrentVectors(null);
      return;
    }
    const date = currentDate;
    const depthVal = volumetricMeta?.depth_levels?.[depthIndex] ?? 0;

    api.getCurrents(date, depthVal, 2)
      .then(setCurrentVectors)
      .catch(console.error);
  }, [showCurrents, currentDate, depthIndex, volumetricMeta]);

  // ── Fetch Isosurface Grid when toggled ────────────────────────────────────
  useEffect(() => {
    if (!showIsosurface) {
      setIsosurfaceGrid(null);
      return;
    }
    const date = currentDate;
    api.getIsosurfaceGrid("temperature", date)
      .then(setIsosurfaceGrid)
      .catch(console.error);
  }, [showIsosurface, currentDate]);

  // ── Time animation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !activeDates.length) return;
    playTimer.current = setInterval(() => {
      setDateIndex((i) => (i + 1) % activeDates.length);
    }, 1200);
    return () => clearInterval(playTimer.current);
  }, [isPlaying, activeDates]);

  // ── In-situ profile fetch (Argo or Glider) ─────────────────────────────────
  useEffect(() => {
    if (!selectedInstrumentId) return;
    setProfileLoading(true);

    const isGlider = selectedInstrumentId.startsWith("GLIDER") || gliders.some(g => g.instrument_id === selectedInstrumentId);
    if (isGlider) {
      api.getGliderProfile(selectedInstrumentId)
        .then(setProfile)
        .catch(console.error)
        .finally(() => setProfileLoading(false));
    } else {
      api.getProfile(selectedInstrumentId, variable)
        .then(setProfile)
        .catch(console.error)
        .finally(() => setProfileLoading(false));
    }
  }, [selectedInstrumentId, variable, gliders]);

  // ── Map click → time-series fetch ─────────────────────────────────────────
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

  const activeVarInfo = useMemo(() => {
    if (datasetMode === "volumetric") {
      return volumetricMeta?.variables?.find((v) => v.name === variable) || {
        name: variable,
        long_name: variable,
        units: "",
        icon: "🌊",
      };
    }
    return meta?.variables?.find((v) => v.name === variable);
  }, [meta, volumetricMeta, datasetMode, variable]);

  const vc = varColor(variable);
  const depthLevels = volumetricMeta?.depth_levels || [0, 10, 20, 50, 100, 200, 500, 1000];

  return (
    <div className="app-shell">
      {/* ═══════════════════════════════════════════════════════
          TOP BAR
          ═══════════════════════════════════════════════════════ */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">🌊</div>
          <div className="brand-text">
            <h1>SAGAR<span className="accent">-DRISHTI</span></h1>
            <div className="subtitle">सागर-दृष्टि · 3D Ocean Intelligence · SIH 26067 · INCOIS</div>
          </div>
        </div>

        <nav className="topbar-tabs">
          <button
            className={`topbar-tab${activeTab === "viz" ? " active" : ""}`}
            onClick={() => setActiveTab("viz")}
          >
            🌐 3D/2D Viewport
          </button>
          <button
            className={`topbar-tab${activeTab === "argo" ? " active" : ""}`}
            onClick={() => setActiveTab("argo")}
          >
            🔴 Argo & Gliders ({instruments.length + gliders.length})
          </button>
          <button
            className={`topbar-tab${activeTab === "analytics" ? " active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            📊 Analytics & Anomalies
          </button>
        </nav>

        <div className="topbar-right">
          <div className="dataset-badge">
            <div className="dot" />
            <strong>{datasetMode === "volumetric" ? "4D Volumetric" : "CMEMS Gridded"}</strong>
            &nbsp;·&nbsp;<strong style={{ color: "var(--c-chla)" }}>{instruments.length} Floats + {gliders.length} Gliders</strong>
          </div>
          <div className={`status-pill${apiOnline === false ? " offline" : ""}`}>
            {apiOnline === null
              ? "Connecting…"
              : apiOnline
              ? "API Online"
              : "API Offline"}
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
            gliders={gliders}
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
          {/* Left panel */}
          <ControlPanel
            meta={meta}
            volumetricMeta={volumetricMeta}
            datasetMode={datasetMode}
            onDatasetModeChange={handleDatasetModeChange}
            variable={variable}
            onVariableChange={(v) => { setIsPlaying(false); setVariable(v); }}
            dateIndex={safeDateIndex}
            onDateIndexChange={(i) => { setIsPlaying(false); setDateIndex(i); }}
            dates={activeDates}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            depthIndex={depthIndex}
            onDepthIndexChange={setDepthIndex}
            depthLevels={depthLevels}
            showCurrents={showCurrents}
            onToggleCurrents={() => setShowCurrents(s => !s)}
            showIsosurface={showIsosurface}
            onToggleIsosurface={() => setShowIsosurface(s => !s)}
            isovalue={isovalue}
            onIsovalueChange={setIsovalue}
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
            {surfaceLoading && !surface && (
              <div className="viewport-loading">
                <div className="loading-spinner" />
                <div className="loading-text">Loading Ocean Data…</div>
              </div>
            )}

            {/* 2D GIS Map */}
            {viewMode === "map" && (
              <OceanMap
                surface={surface || null}
                palette={palette}
                colorMin={colorRange?.min}
                colorMax={colorRange?.max}
                colorScale={colorScale}
                layerOpacity={layerOpacity}
                onPointClick={handleMapClick}
                onHover={handleHover}
                instruments={instruments}
                gliders={gliders}
                currentVectors={currentVectors}
                showCurrents={showCurrents}
                onSelectInstrument={setSelectedInstrumentId}
                selectedInstrumentId={selectedInstrumentId}
              />
            )}

            {/* 3D WebGL Scene */}
            {viewMode === "3d" && (
              <Scene3D
                surface={surface}
                palette={palette}
                colorScale={colorScale}
                colorMin={colorRange?.min}
                colorMax={colorRange?.max}
                verticalExaggeration={verticalExaggeration}
                layerOpacity={layerOpacity}
                instruments={instruments}
                gliders={gliders}
                currentVectors={currentVectors}
                showCurrents={showCurrents}
                isosurfaceGrid={isosurfaceGrid}
                showIsosurface={showIsosurface}
                isovalue={isovalue}
                onSelectInstrument={setSelectedInstrumentId}
                selectedInstrumentId={selectedInstrumentId}
              />
            )}

            {/* 2D / 3D Mode Toggle */}
            <div className="view-toggle" style={{ top: "auto", bottom: 14, right: 14 }}>
              <button
                className={`view-toggle-btn${viewMode === "map" ? " active" : ""}`}
                onClick={() => setViewMode("map")}
              >
                🗺️ 2D Map
              </button>
              <button
                className={`view-toggle-btn${viewMode === "3d" ? " active" : ""}`}
                onClick={() => setViewMode("3d")}
              >
                🌐 3D WebGL
              </button>
            </div>

            {/* Hover Coordinate Info */}
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

            {/* Colorbar legend */}
            {activeVarInfo && colorRange && (
              <div className="legend">
                <div className="legend-title">
                  <span style={{ color: vc }}>{activeVarInfo.icon} {activeVarInfo.long_name}</span>
                  {datasetMode === "volumetric" && (
                    <span style={{ color: "#00d4f0", marginLeft: 8, fontWeight: 700 }}>
                      @{depthLevels[depthIndex]}m depth
                    </span>
                  )}
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

            <div className="hint-overlay">
              {viewMode === "map"
                ? "Hover for ocean values · Click for time-series · Click markers for depth validation"
                : "Drag to rotate · Scroll to zoom · Toggle Marching Cubes Isosurface or Current Vectors in sidebar"}
            </div>
          </div>

          {/* Right panel: Dual-Line Model vs Observation Chart */}
          <ProfilePanel
            instruments={instruments}
            gliders={gliders}
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
   Argo & Gliders Explorer Tab
   ═══════════════════════════════════════════════════════ */
function ArgoExplorer({ instruments, gliders, allTrajectories, selectedId, onSelect, profile, profileLoading, variable }) {
  const allList = [
    ...instruments.map(i => ({ ...i, kind: "argo" })),
    ...gliders.map(g => ({ ...g, kind: "glider" })),
  ];
  const bgcFloats = instruments.filter(i => i.bgc_params?.length > 0);

  return (
    <div className="argo-layout">
      <div className="argo-sidebar">
        <div className="argo-header-card">
          <div className="argo-title">🔴 In-Situ Instrument Explorer</div>
          <div className="argo-subtitle">
            {instruments.length} Coriolis Argo Floats + {gliders.length} IOOS Slocum Gliders<br />
            Indian Ocean Domain (5°N–23°N, 60°E–97°E)
          </div>
        </div>

        <div className="float-stat-row">
          <div className="float-stat">
            <span className="float-stat-value">{instruments.length}</span>
            <div className="float-stat-label">Argo Floats</div>
          </div>
          <div className="float-stat">
            <span className="float-stat-value" style={{ color: "#00d4f0" }}>{gliders.length}</span>
            <div className="float-stat-label">Gliders</div>
          </div>
          <div className="float-stat">
            <span className="float-stat-value" style={{ color: "var(--c-doxy)" }}>{bgcFloats.length}</span>
            <div className="float-stat-label">BGC Floats</div>
          </div>
          <div className="float-stat">
            <span className="float-stat-value" style={{ color: "var(--c-chla)" }}>{allTrajectories.length}</span>
            <div className="float-stat-label">Trajectories</div>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-section-title"><span className="icon">📡</span> Select Platform</div>
          <ul className="instrument-list">
            {allList.map((inst) => {
              const isGlider = inst.kind === "glider";
              return (
                <li
                  key={inst.instrument_id}
                  className={inst.instrument_id === selectedId ? "active" : ""}
                  onClick={() => onSelect(inst.instrument_id)}
                >
                  <div className="inst-header">
                    <span className={`tag ${isGlider ? "bgc" : "argo"}`}>
                      {isGlider ? "GLIDER" : "ARGO"}
                    </span>
                    {inst.bgc_params?.length > 0 && <span className="tag bgc">BGC</span>}
                    <span className="inst-id">{inst.platform_number || inst.instrument_id}</span>
                  </div>
                  <div className="inst-meta">
                    {inst.latitude?.toFixed(2)}°N, {inst.longitude?.toFixed(2)}°E
                    &nbsp;·&nbsp;{inst.timestamp?.slice(0, 10)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="argo-main">
        {!selectedId ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: "60%", color: "var(--steel-500)", textAlign: "center", gap: 16
          }}>
            <div style={{ fontSize: 48, opacity: 0.35 }}>🔴</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--steel-700)" }}>
              Select an In-Situ Platform
            </div>
            <div style={{ fontSize: 12, maxWidth: 360, lineHeight: 1.7, color: "var(--steel-500)" }}>
              Choose an Argo float or Glider from the list to view its multi-parameter depth profile,
              validation statistics against numerical models, and T-S water mass diagram.
            </div>
          </div>
        ) : (
          <ProfilePanel
            instruments={instruments}
            gliders={gliders}
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
