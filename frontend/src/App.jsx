import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { api } from "./api.js";
import { paletteForVariable, paletteGradientCss, varColor, colorForValue, PALETTES } from "./utils/colormap.js";

import ControlPanel from "./components/ControlPanel.jsx";
import OceanMap from "./components/OceanMap.jsx";
import Scene3D from "./components/Scene3D.jsx";
import ProfilePanel from "./components/ProfileChart.jsx";
import StatsDashboard from "./components/StatsDashboard.jsx";
import InstrumentSummaryPanel from "./components/InstrumentSummaryPanel.jsx";
import DatasetHealthDashboard from "./components/DatasetHealthDashboard.jsx";
import HFRadarRamaExplorer from "./components/HFRadarRamaExplorer.jsx";
// Static import so Vite bundles Cesium in the same chunk (avoids CJS interop issues with lazy())
import CesiumGlobeView from "./components/CesiumGlobeView.jsx";
import StudentRightPanel from "./components/student/StudentRightPanel.jsx";
import ForecasterRightPanel from "./components/forecaster/ForecasterRightPanel.jsx";

// Auth & RBAC Components
import LandingPage from "./components/auth/LandingPage.jsx";
import AuthModal from "./components/auth/AuthModal.jsx";
import AccessDenied from "./components/auth/AccessDenied.jsx";
import UserHeaderMenu from "./components/auth/UserHeaderMenu.jsx";
import AdminPanel from "./components/auth/AdminPanel.jsx";
import { getCurrentRole, getStoredUser, logout, subscribeAuthState } from "./services/authService.js";


// Default instant metadata for zero-latency initial render
const INITIAL_CMEMS_META = {
  variables: [
    { name: "tob", long_name: "Sea Bottom Temperature", units: "°C", palette: "thermal", icon: "🌡️", category: "Temperature", valid_min: -10.0, valid_max: 50.0, description: "Daily mean temperature at the sea floor — key indicator of bottom-water mass intrusions." },
    { name: "sob", long_name: "Sea Bottom Salinity", units: "PSU", palette: "haline", icon: "🧂", category: "Salinity", valid_min: 0.0, valid_max: 50.0, description: "Practical salinity at the sea floor." },
    { name: "zos", long_name: "Sea Surface Height", units: "m", palette: "viridis", icon: "🌊", category: "Dynamics", valid_min: -5.0, valid_max: 5.0, description: "Sea surface height above geoid." },
    { name: "mlotst", long_name: "Mixed Layer Depth", units: "m", palette: "deep", icon: "📏", category: "Dynamics", valid_min: 0.0, valid_max: 8000.0, description: "Depth of oceanic mixed layer." },
    { name: "pbo", long_name: "Sea Floor Pressure", units: "dbar", palette: "deep", icon: "📊", category: "Pressure", valid_min: 0.0, valid_max: 8000.0, description: "Sea water pressure at the sea floor." },
    { name: "siconc", long_name: "Sea Ice Concentration", units: "fraction", palette: "ice", icon: "❄️", category: "Cryosphere", valid_min: 0.0, valid_max: 1.0, description: "Surface fraction covered by sea ice." }
  ],
  bbox: [60.0, 5.0, 97.0, 23.0],
  spatial_resolution: 0.083,
  time_range: { start: "2022-06-01", end: "2026-09-09", count: 1562 },
  grid_shape: [216, 444]
};

const INITIAL_VOLUMETRIC_META = {
  variables: [
    { name: "temperature", long_name: "Potential Temperature (4D)", units: "°C", palette: "thermal", icon: "🌡️", category: "Thermodynamics" },
    { name: "salinity", long_name: "Practical Salinity (4D)", units: "PSU", palette: "haline", icon: "🧂", category: "Thermodynamics" },
    { name: "ssh", long_name: "Sea Surface Height Anomaly", units: "m", palette: "viridis", icon: "🌊", category: "Dynamics" },
    { name: "u_current", long_name: "Zonal Current Velocity (U)", units: "m/s", palette: "currents", icon: "💨", category: "Velocity" },
    { name: "v_current", long_name: "Meridional Current Velocity (V)", units: "m/s", palette: "currents", icon: "💨", category: "Velocity" },
    { name: "current_speed", long_name: "Total Current Speed (|V|)", units: "m/s", palette: "speed", icon: "🌀", category: "Velocity" }
  ],
  depth_levels: [0, 10, 20, 50, 100, 200, 500, 1000],
  dates: ["2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28", "2026-08-29", "2026-08-30", "2026-08-31"],
  bbox: [60.0, 5.0, 97.0, 23.0]
};

function getLocalCache(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalCache(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export default function App() {
  // ── API / dataset state ──────────────────────────────────────────────────
  const [apiOnline, setApiOnline] = useState(true);
  const [datasetStatus, setDatasetStatus] = useState(() => getLocalCache("sd_dataset_status", {
    cmems_surface: { name: "CMEMS Physical Ocean Surface", status: "live", last_updated: "2026-09-08T00:00:00Z" },
    cmems_volumetric: { name: "CMEMS 4D Multi-Depth Hydrodynamics", status: "live", last_updated: "2026-08-31T00:00:00Z" },
    argo_coriolis: { name: "INCOIS / Coriolis Argo Telemetry", status: "live", last_updated: "2026-09-08T00:00:00Z" },
    glider_ioos: { name: "INCOIS Slocum Autonomous Gliders", status: "live", last_updated: "2026-09-08T00:00:00Z" },
    hf_radar: { name: "NIOT / INCOIS Coastal HF Radar Array", status: "live", last_updated: "2026-09-08T00:00:00Z" },
    rama_moorings: { name: "NOAA / INCOIS RAMA Moored Array", status: "live", last_updated: "2026-09-08T00:00:00Z" }
  }));
  const [meta, setMeta] = useState(() => getLocalCache("sd_meta", INITIAL_CMEMS_META));
  const [volumetricMeta, setVolumetricMeta] = useState(() => getLocalCache("sd_volumetric_meta", INITIAL_VOLUMETRIC_META));
  const [dates, setDates] = useState(() => getLocalCache("sd_dates", ["2024-01-01", "2026-08-31"]));
  const [hfRadarStations, setHfRadarStations] = useState(() => getLocalCache("sd_hfradar", []));
  const [hfRadarCurrents, setHfRadarCurrents] = useState([]);
  const [ramaBuoys, setRamaBuoys] = useState(() => getLocalCache("sd_rama", []));

  // ── Active selection state ───────────────────────────────────────────────
  const [datasetMode, setDatasetMode] = useState("cmems"); // "cmems" | "volumetric"
  const [variable, setVariable] = useState("tob");
  const [dateIndex, setDateIndex] = useState(600);
  const [depthIndex, setDepthIndex] = useState(() => {
    const cachedDepths = getLocalCache("sd_volumetric_meta", INITIAL_VOLUMETRIC_META)?.depth_levels;
    const defaultIndex = (cachedDepths || INITIAL_VOLUMETRIC_META.depth_levels)
      .findIndex((depth) => Math.abs(depth - 453.94) < 0.01);
    return defaultIndex >= 0 ? defaultIndex : 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);

  // ── View & Auth State ───────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState("landing"); // "landing" | "explore" | "forecaster" | "admin"
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(getCurrentRole());
  const [authReady, setAuthReady] = useState(false);

  // ── Display settings ─────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState("map"); // "map" | "globe" | "webgl"
  const [activeTab, setActiveTab] = useState("explore"); // "viz" | "analytics" | "argo" | "explore" | "forecaster"
  const [verticalExaggeration, setVerticalExaggeration] = useState(5.0);  // Default 5x for better 3D terrain visibility
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
  const [surface, setSurface] = useState(() => getLocalCache("sd_surface", null));
  const [surfaceLoading, setSurfaceLoading] = useState(false);

  // ── In-situ platforms: Argo + Gliders ────────────────────────────────────
  const [instruments, setInstruments] = useState(() => getLocalCache("sd_instruments", []));
  const [gliders, setGliders] = useState(() => getLocalCache("sd_gliders", []));
  const [selectedInstrumentId, setSelectedInstrumentId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [modelProfile, setModelProfile] = useState(null);
  const [allTrajectories, setAllTrajectories] = useState(() => getLocalCache("sd_trajectories", []));

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
      // NOTE: 4D volumetric dataset has LIMITED coverage (only 7 days: Aug 25-31)
      // vs CMEMS 2D which has 1,562 days (2022-06-01 to 2026-09-09)
      return volumetricMeta?.dates || ["2026-08-31"];
    }
    return dates.length ? dates : ["2024-01-01"];
  }, [datasetMode, volumetricMeta, dates]);

  const safeDateIndex = Math.min(dateIndex, Math.max(0, activeDates.length - 1));
  const currentDate = activeDates[safeDateIndex] || "2026-08-31";

  // ── Initial Bootstrap & Routing ─────────────────────────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    if (
      hash === "#explore" ||
      hash === "#student" ||
      hash === "#outreach" ||
      pathname.includes("/explore") ||
      pathname.includes("/student")
    ) {
      setCurrentView("explore");
      setActiveTab("explore");
    } else if (hash === "#admin" || pathname.includes("/admin")) {
      setCurrentView("admin");
    } else if (
      hash === "#forecaster" ||
      hash === "#researcher" ||
      hash === "#operational" ||
      pathname.includes("/forecaster") ||
      pathname.includes("/researcher")
    ) {
      setCurrentView("forecaster");
      setActiveTab("forecaster");
    } else {
      setCurrentView("landing");
    }
  }, []);

  // ── Sync Firebase Auth state across tabs & reloads ───────────────────────
  useEffect(() => {
    const unsub = subscribeAuthState((user, role) => {
      if (user && role) {
        setUserRole(role);
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const handleSelectMode = useCallback((mode) => {
    if (mode === "landing") {
      setCurrentView("landing");
      window.location.hash = "";
      return;
    }
    if (mode === "explore") {
      setCurrentView("explore");
      setActiveTab("explore");
      if (datasetMode === "volumetric") {
        const availableDepths = volumetricMeta?.depth_levels || depthLevels;
        const defaultDepthIndex = availableDepths.findIndex((depth) => Math.abs(depth - 453.94) < 0.01);
        setDepthIndex(defaultDepthIndex >= 0 ? defaultDepthIndex : availableDepths.length - 1);
      }
      window.location.hash = "explore";
      return;
    }
    if (mode === "forecaster") {
      setCurrentView("forecaster");
      setActiveTab("forecaster");
      window.location.hash = "forecaster";
      return;
    }
    if (mode === "admin") {
      setCurrentView("admin");
      window.location.hash = "admin";
      return;
    }
  }, []);

  // Just open the auth modal — role routing happens inside handleAuthSuccess
  const handleOpenAuth = () => {
    setAuthModalOpen(true);
  };

  // Called by AuthModal after successful login — routes by Firestore role
  const handleAuthSuccess = (user, role) => {
    setUserRole(role);
    setAuthModalOpen(false);
    if (role === 'admin') {
      handleSelectMode('admin');
    } else if (role === 'forecaster') {
      handleSelectMode('forecaster');
    } else {
      handleSelectMode('explore');
    }
  };

  useEffect(() => {
    api.health()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    api.getVariables()
      .then((m) => {
        setMeta(m);
        setLocalCache("sd_meta", m);
        if (m.variables?.length > 0) setVariable(m.variables[0].name);
      })
      .catch(console.error);

    api.getVolumetricMeta()
      .then((vm) => {
        setVolumetricMeta(vm);
        setLocalCache("sd_volumetric_meta", vm);
      })
      .catch(console.error);

    api.getDates()
      .then((d) => {
        const dateList = d.dates || [];
        setDates(dateList);
        setLocalCache("sd_dates", dateList);
        setDateIndex(Math.min(600, (dateList.length || 1) - 1));
      })
      .catch(console.error);

    const fetchDatasetStatus = () => {
      api.getDatasetStatus()
        .then((ds) => {
          setDatasetStatus(ds);
          setLocalCache("sd_dataset_status", ds);
        })
        .catch(console.error);
    };

    fetchDatasetStatus();
    const statusInterval = setInterval(fetchDatasetStatus, 30000);

    api.getInstruments()
      .then((inst) => {
        setInstruments(inst || []);
        setLocalCache("sd_instruments", inst || []);
      })
      .catch(console.error);

    api.getGliders()
      .then((gl) => {
        setGliders(gl || []);
        setLocalCache("sd_gliders", gl || []);
      })
      .catch(console.error);

    api.getAllTrajectories()
      .then((tr) => {
        setAllTrajectories(tr || []);
        setLocalCache("sd_trajectories", tr || []);
      })
      .catch(console.error);

    api.getHFRadarStations()
      .then((st) => {
        setHfRadarStations(st || []);
        setLocalCache("sd_hfradar", st || []);
      })
      .catch(console.error);

    api.getHFRadarCurrents()
      .then(setHfRadarCurrents)
      .catch(console.error);

    api.getRAMABuoys()
      .then((buoys) => {
        setRamaBuoys(buoys || []);
        setLocalCache("sd_rama", buoys || []);
      })
      .catch(console.error);

    return () => clearInterval(statusInterval);
  }, []);

  // ── Switch active variable list when dataset mode switches ────────────────
  const handleDatasetModeChange = (mode) => {
    setDatasetMode(mode);
    setDateIndex(0);
    if (mode === "volumetric") {
      const availableDepths = volumetricMeta?.depth_levels || depthLevels;
      const defaultDepthIndex = availableDepths.findIndex((depth) => Math.abs(depth - 453.94) < 0.01);
      setDepthIndex(defaultDepthIndex >= 0 ? defaultDepthIndex : availableDepths.length - 1);
      const newVar = "temperature";
      setVariable(newVar);
      setPalette(paletteForVariable(newVar));
      setColorRange(null);
    } else {
      const newVar = "tob";
      setVariable(newVar);
      setPalette(paletteForVariable(newVar));
      setColorRange(null);
    }
  };

  // ── Handle variable change with automatic palette & range recalibration ──
  const handleVariableChange = useCallback((newVar) => {
    setIsPlaying(false);
    setVariable(newVar);
    const newPal = paletteForVariable(newVar);
    setPalette(newPal);
    setColorRange(null);
  }, []);

  // ── Handle Guided Tour Stop Selection ────────────────────────────────────
  const handleTourStopSelect = useCallback((stop) => {
    if (!stop) return;
    if (stop.datasetMode && stop.datasetMode !== datasetMode) {
      setDatasetMode(stop.datasetMode);
    }
    if (stop.variable) {
      handleVariableChange(stop.variable);
    }
    if (stop.depthIndex !== undefined) {
      setDepthIndex(stop.depthIndex);
    }
    if (stop.viewMode) {
      setViewMode(stop.viewMode);
    }
  }, [datasetMode, handleVariableChange]);

  // ── Handle Expert Workflow Preset Selection ──────────────────────────────
  const handleWorkflowPresetSelect = useCallback((preset) => {
    if (!preset) return;
    if (preset.datasetMode && preset.datasetMode !== datasetMode) {
      setDatasetMode(preset.datasetMode);
    }
    if (preset.variable) {
      handleVariableChange(preset.variable);
    }
    if (preset.depthIndex !== undefined) {
      setDepthIndex(preset.depthIndex);
    }
    if (preset.viewMode) {
      setViewMode(preset.viewMode);
    }
  }, [datasetMode, handleVariableChange]);

  // ── Fetch surface or depth slice data ────────────────────────────────────
  useEffect(() => {
    if (!variable) return;
    const date = currentDate;

    setSurfaceLoading(true);

    if (datasetMode === "volumetric") {
      const depthVal = volumetricMeta?.depth_levels?.[depthIndex] ?? 0;
      api.getDepthSlice(variable, date, depthVal, 2)
        .then((s) => {
          if (s && s.values) {
            setSurface(s);
            setLocalCache("sd_surface", s);
            if (s.min_value !== undefined && s.max_value !== undefined) {
              setColorRange({ min: s.min_value, max: s.max_value });
            }
          }
        })
        .catch(console.error)
        .finally(() => setSurfaceLoading(false));
    } else {
      api.getSurface(variable, date, 2)
        .then((s) => {
          if (s && s.values) {
            setSurface(s);
            setLocalCache("sd_surface", s);
            if (s.min_value !== undefined && s.max_value !== undefined) {
              setColorRange({ min: s.min_value, max: s.max_value });
            }
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

  // ── Co-located model profile fetch (for comparison & summary) ────────────
  useEffect(() => {
    if (!profile) {
      setModelProfile(null);
      return;
    }
    const varName = (variable === "sob" || variable === "salinity") ? "salinity" : "temperature";
    const dateStr = profile.timestamp?.slice(0, 10) || "2026-08-31";
    api.getModelProfile(profile.latitude, profile.longitude, dateStr, varName)
      .then(setModelProfile)
      .catch((err) => {
        console.warn("Could not fetch model profile for summary:", err);
        setModelProfile(null);
      });
  }, [profile, variable]);

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

  // ── Render 1: Landing Page ───────────────────────────────────────────────
  if (currentView === "landing") {
    return (
      <>
        <LandingPage
          onSelectMode={handleSelectMode}
          onOpenAuth={handleOpenAuth}
          currentUser={getStoredUser()}
          userRole={userRole}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // ── Render 1b: Admin Panel ───────────────────────────────────────────────
  if (currentView === "admin") {
    if (!authReady) return null;
    if (userRole !== 'admin') {
      handleSelectMode('explore');
      return null;
    }
    return (
      <AdminPanel 
        onGoBack={() => handleSelectMode('explore')} 
        onLogout={async () => {
          await logout();
          setUserRole('guest');
          handleSelectMode('landing');
        }}
      />
    );
  }

  // ── Render 2: Access Denied Guard for Forecaster Mode ───────────────────
  if (currentView === "forecaster" && !authReady) return null;

  if (currentView === "forecaster" && userRole !== "forecaster" && userRole !== "admin") {
    return (
      <>
        <AccessDenied 
          onOpenAuth={handleOpenAuth} 
          onLaunchExplorer={() => handleSelectMode("explore")} 
          onGoHome={() => handleSelectMode("landing")} 
        />
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
          onSuccess={handleAuthSuccess} 
        />
      </>
    );
  }

  // ── Render 3: Workspace Application Shell ────────────────────────────────
  return (
    <div className="app-shell">
      {/* ═══════════════════════════════════════════════════════
          TOP BAR
          ═══════════════════════════════════════════════════════ */}
      <header className="topbar">
        <div className="brand" onClick={() => handleSelectMode("landing")} style={{ cursor: "pointer" }}>
          <div className="brand-icon" aria-label="Sagar Drishti ocean intelligence">🌊</div>
          <div className="brand-text">
            <h1>SAGAR<span className="accent">-DRISHTI</span></h1>
            <div className="subtitle">सागर-दृष्टि · 3D Ocean Intelligence · SIH 26067 · INCOIS</div>
          </div>
        </div>

        <nav className="topbar-tabs">
          {/* 1. Forecaster Mode */}
          <button
            className={`topbar-tab forecaster-tab${(activeTab === "forecaster" || currentView === "forecaster") ? " active" : ""}`}
            onClick={() => handleSelectMode("forecaster")}
          >
            🌪️ Forecaster Mode
          </button>

          {/* 2. Explorer Mode */}
          <button
            className={`topbar-tab explorer-tab${(activeTab === "explore" && currentView !== "forecaster") ? " active" : ""}`}
            onClick={() => handleSelectMode("explore")}
          >
            🧭 Explorer Mode
          </button>

          {/* 3. 3D/2D Viewport */}
          <button
            className={`topbar-tab${activeTab === "viz" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("viz");
              if (currentView !== "explore" && currentView !== "forecaster") {
                setCurrentView("explore");
              }
            }}
          >
            🌊 3D/2D Viewport
          </button>

          {/* 4. Argo & Gliders */}
          <button
            className={`topbar-tab${activeTab === "argo" ? " active" : ""}`}
            onClick={() => setActiveTab("argo")}
          >
            🤖 Argo & Gliders ({instruments.length + gliders.length})
          </button>

          {/* 5. HF Radar & RAMA */}
          <button
            className={`topbar-tab${activeTab === "hfradar_rama" ? " active" : ""}`}
            onClick={() => setActiveTab("hfradar_rama")}
          >
            📡 HF Radar & RAMA ({hfRadarStations.length + ramaBuoys.length})
          </button>

          {/* 6. Analytics & Anomalies */}
          <button
            className={`topbar-tab${activeTab === "analytics" ? " active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            📊 Analytics & Anomalies
          </button>

          {/* 7. Live Data Pipeline */}
          <button
            className={`topbar-tab pipeline-tab${activeTab === "pipeline" ? " active" : ""}`}
            onClick={() => setActiveTab("pipeline")}
          >
            🛰️ Live Data Pipeline
            <span className="tab-pill" style={{
              fontSize: 9,
              padding: "2px 6px",
              borderRadius: "4px",
              background: "rgba(5, 150, 105, 0.25)",
              color: "#34d399",
              border: "1px solid rgba(5, 150, 105, 0.4)",
              fontWeight: 800,
              marginLeft: 4
            }}>
              6/6 LIVE
            </span>
          </button>

          {/* 8. Admin tab (only visible to admins) */}
          {userRole === 'admin' && (
            <button
              className={`topbar-tab admin-tab${currentView === "admin" ? " active" : ""}`}
              onClick={() => handleSelectMode("admin")}
              style={{
                background: currentView === "admin" ? "#8b5cf6" : "transparent",
                color: currentView === "admin" ? "#ffffff" : "#a78bfa",
                fontWeight: 700,
                border: "1.5px solid rgba(139,92,246,0.6)",
                borderRadius: 6,
              }}
            >
              🛡️ Admin
            </button>
          )}
        </nav>

        <div className="topbar-right">
          <UserHeaderMenu 
            currentMode={currentView} 
            onNavigateMode={handleSelectMode} 
            onOpenAuth={handleOpenAuth} 
            onLogoutSuccess={() => {
              setUserRole('guest');
              handleSelectMode('landing');
            }} 
          />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          DATASET HEALTH & LIVE PIPELINE TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "pipeline" && (
        <main style={{ height: "100%", overflow: "hidden" }}>
          <DatasetHealthDashboard
            datasetStatus={datasetStatus}
            onRefresh={() => api.getDatasetStatus().then(setDatasetStatus)}
          />
        </main>
      )}

      {/* ═══════════════════════════════════════════════════════
          HF RADAR & RAMA MOORED BUOY OBSERVATORY TAB
          ═══════════════════════════════════════════════════════ */}
      {activeTab === "hfradar_rama" && (
        <main style={{ height: "100%", overflow: "hidden" }}>
          <HFRadarRamaExplorer
            hfRadarStations={hfRadarStations}
            ramaBuoys={ramaBuoys}
            selectedId={selectedInstrumentId}
            onSelectInstrument={setSelectedInstrumentId}
          />
        </main>
      )}

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
            modelProfile={modelProfile}
          />
        </main>
      )}

      {/* ═══════════════════════════════════════════════════════
          VISUALIZATION, EXPLORER & FORECASTER TAB
          ═══════════════════════════════════════════════════════ */}
      {(activeTab === "viz" || activeTab === "explore" || activeTab === "forecaster") && (
        <main className="main-layout">
          {/* Left panel */}
          <ControlPanel
            meta={meta}
            volumetricMeta={volumetricMeta}
            datasetMode={datasetMode}
            onDatasetModeChange={handleDatasetModeChange}
            variable={variable}
            onVariableChange={handleVariableChange}
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
            nativeMin={surface?.min_value}
            nativeMax={surface?.max_value}
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
                hfRadarStations={hfRadarStations}
                hfRadarCurrents={hfRadarCurrents}
                ramaBuoys={ramaBuoys}
                showHFRadar={true}
                showRAMABuoys={true}
                currentVectors={currentVectors}
                showCurrents={showCurrents}
                onSelectInstrument={setSelectedInstrumentId}
                selectedInstrumentId={selectedInstrumentId}
              />
            )}

            {/* 3D WebGL View — Three.js bathymetric terrain with Marching Cubes */}
            {viewMode === "webgl" && (
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

            {/* Cesium 3D Globe View (Google Earth-style) */}
            {viewMode === "globe" && (
              <CesiumGlobeView
                surface={surface}
                palette={palette}
                colorScale={colorScale}
                colorMin={colorRange?.min}
                colorMax={colorRange?.max}
                layerOpacity={layerOpacity}
                instruments={instruments}
                gliders={gliders}
                hfRadarStations={hfRadarStations}
                ramaBuoys={ramaBuoys}
                currentVectors={currentVectors}
                showCurrents={showCurrents}
                onSelectInstrument={setSelectedInstrumentId}
                selectedInstrumentId={selectedInstrumentId}
              />
            )}


            {/* 2D / Globe / 3D WebGL View Toggles */}
            <div className="view-toggle" style={{ top: "auto", bottom: 14, right: 14 }}>
              <button
                className={`view-toggle-btn${viewMode === "map" ? " active" : ""}`}
                onClick={() => setViewMode("map")}
              >
                🗺️ 2D Map
              </button>
              <button
                className={`view-toggle-btn${viewMode === "globe" ? " active" : ""}`}
                onClick={() => setViewMode("globe")}
              >
                🌍 Globe
              </button>
              <button
                className={`view-toggle-btn${viewMode === "webgl" ? " active" : ""}`}
                onClick={() => setViewMode("webgl")}
              >
                🧊 3D WebGL
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

          {/* Right panel: Student / Explorer, Duty Forecaster, or Default ProfilePanel */}
          {activeTab === "explore" ? (
            <StudentRightPanel
              variable={variable}
              date={currentDate}
              depthIndex={depthIndex}
              depthLevels={depthLevels}
              surfaceStats={surface}
              palette={palette}
              onSelectTourStop={handleTourStopSelect}
            />
          ) : activeTab === "forecaster" ? (
            <ForecasterRightPanel
              variable={variable}
              date={currentDate}
              depthIndex={depthIndex}
              depthLevels={depthLevels}
              surfaceStats={surface}
              palette={palette}
              instruments={instruments}
              gliders={gliders}
              selectedId={selectedInstrumentId}
              onSelectInstrument={setSelectedInstrumentId}
              profile={profile}
              timeSeries={timeSeries}
              timeSeriesPoint={clickedPoint}
              loading={profileLoading || tsLoading}
              datasetMode={datasetMode}
              volumetricMeta={volumetricMeta}
              colorRange={colorRange}
              colorScale={colorScale}
              onSelectWorkflowPreset={handleWorkflowPresetSelect}
            />
          ) : (
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
              colorRange={colorRange}
              surface={surface}
              datasetMode={datasetMode}
              volumetricMeta={volumetricMeta}
              depthIndex={depthIndex}
              depthLevels={depthLevels}
              palette={palette}
              colorScale={colorScale}
            />
          )}
        </main>
      )}

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess} 
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Argo & Gliders Explorer Tab (3-Column Executive Layout)
   ═══════════════════════════════════════════════════════ */
function ArgoExplorer({
  instruments,
  gliders,
  allTrajectories,
  selectedId,
  onSelect,
  profile,
  profileLoading,
  variable,
  modelProfile,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "argo" | "glider" | "bgc"

  const allList = useMemo(() => [
    ...instruments.map(i => ({ ...i, kind: "argo" })),
    ...gliders.map(g => ({ ...g, kind: "glider" })),
  ], [instruments, gliders]);

  const bgcFloats = useMemo(() => instruments.filter(i => i.bgc_params?.length > 0), [instruments]);

  // Filtered list based on search and type
  const filteredList = useMemo(() => {
    return allList.filter((inst) => {
      // Type filter
      if (filterType === "argo" && inst.kind !== "argo") return false;
      if (filterType === "glider" && inst.kind !== "glider") return false;
      if (filterType === "bgc" && (!inst.bgc_params || inst.bgc_params.length === 0)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idStr = String(inst.platform_number || inst.instrument_id || "").toLowerCase();
        const nameStr = String(inst.name || "").toLowerCase();
        const latStr = String(inst.latitude || "");
        const lonStr = String(inst.longitude || "");
        return idStr.includes(q) || nameStr.includes(q) || latStr.includes(q) || lonStr.includes(q);
      }
      return true;
    });
  }, [allList, filterType, searchQuery]);

  return (
    <div className="argo-layout">
      {/* ── Left Column: In-Situ Platform List Sidebar ── */}
      <div className="argo-sidebar">
        <div className="argo-header-card">
          <div className="argo-title">In-Situ Instrument Explorer</div>
          <div className="argo-subtitle">
            {instruments.length} Coriolis Argo Floats + {gliders.length} IOOS Slocum Gliders<br />
            Indian Ocean Domain (5°N–23°N, 60°E–97°E)
          </div>
        </div>

        {/* 4 Stat Boxes */}
        <div className="float-stat-row">
          <div className="float-stat">
            <span className="float-stat-value">{instruments.length}</span>
            <div className="float-stat-label">Floats</div>
          </div>
          <div className="float-stat">
            <span className="float-stat-value" style={{ color: "#00d4f0" }}>{gliders.length}</span>
            <div className="float-stat-label">Gliders</div>
          </div>
          <div className="float-stat">
            <span className="float-stat-value" style={{ color: "var(--c-doxy)" }}>{bgcFloats.length}</span>
            <div className="float-stat-label">BGC</div>
          </div>
          <div className="float-stat">
            <span className="float-stat-value" style={{ color: "var(--c-chla)" }}>{allTrajectories.length}</span>
            <div className="float-stat-label">Tracks</div>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: 10 }}>
          <input
            type="text"
            placeholder="🔍 Search float ID, glider, coords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)",
              border: "2px solid var(--steel-300)", fontSize: 11.5, background: "var(--steel-50)",
              color: "var(--steel-800)", fontFamily: "var(--font-body)"
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 3, marginBottom: 12, background: "var(--steel-50)", padding: 3, borderRadius: "var(--radius-sm)", border: "2px solid var(--steel-300)" }}>
          {[
            { id: "all", label: `All (${allList.length})` },
            { id: "argo", label: `Floats (${instruments.length})` },
            { id: "glider", label: `Gliders (${gliders.length})` },
            { id: "bgc", label: `BGC (${bgcFloats.length})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilterType(id)}
              style={{
                flex: 1, padding: "5px 2px", fontSize: 9.5, fontWeight: 700,
                borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
                background: filterType === id ? "var(--cerulean)" : "transparent",
                color: filterType === id ? "#ffffff" : "var(--steel-600)",
                transition: "all 0.12s", textAlign: "center",
                fontFamily: "var(--font-display)"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Platform List */}
        <div className="panel-section" style={{ border: "none", padding: 0 }}>
          <div className="panel-section-title" style={{ color: "var(--steel-600)", fontSize: 11, marginBottom: 8, borderBottom: "2px solid var(--steel-300)" }}>
            Available Platforms ({filteredList.length})
          </div>
          <ul className="instrument-list">
            {filteredList.map((inst) => {
              const isGlider = inst.kind === "glider";
              const isSelected = inst.instrument_id === selectedId;
              return (
                <li
                  key={inst.instrument_id}
                  className={isSelected ? "active" : ""}
                  onClick={() => onSelect(inst.instrument_id)}
                  style={{
                    borderWidth: 2,
                    borderColor: isSelected ? "var(--cyan)" : "var(--steel-300)",
                    background: isSelected ? "var(--steel-200)" : "var(--steel-100)",
                    borderRadius: "var(--radius-sm)", padding: "8px 10px", marginBottom: 5,
                    boxShadow: isSelected ? "2px 2px 0px var(--cerulean)" : "none"
                  }}
                >
                  <div className="inst-header" style={{ justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={`tag ${isGlider ? "glider" : "argo"}`}>
                        {isGlider ? "GLIDER" : "ARGO"}
                      </span>
                      {inst.bgc_params?.length > 0 && <span className="tag bgc">BGC</span>}
                      <span className="inst-id" style={{ color: isSelected ? "var(--cyan)" : "var(--steel-800)" }}>
                        {inst.platform_number || inst.instrument_id}
                      </span>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 9, color: "var(--cyan)", fontWeight: 800 }}>
                        ACTIVE →
                      </span>
                    )}
                  </div>
                  <div className="inst-meta" style={{ marginTop: 3, color: "var(--steel-600)" }}>
                    {inst.latitude?.toFixed(2)}°N, {inst.longitude?.toFixed(2)}°E
                    &nbsp;·&nbsp;{inst.timestamp?.slice(0, 10)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Center Column: Direct Graph Viewport (NO duplicate instrument list!) ── */}
      <div className="argo-main">
        {!selectedId ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: "75%", color: "#64748b", textAlign: "center", gap: 14,
            background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 36,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <div style={{ fontSize: 52, opacity: 0.7 }}>📡</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              Select an In-Situ Instrument
            </div>
            <div style={{ fontSize: 12.5, maxWidth: 420, lineHeight: 1.7, color: "#475569" }}>
              Choose any Argo profiling float or Autonomous Ocean Glider from the left panel to immediately view its full multi-parameter depth profile, numerical model co-location errors, and T-S water mass distribution.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                className="btn btn-primary"
                onClick={() => onSelect(allList[0]?.instrument_id)}
                style={{
                  padding: "8px 16px", fontSize: 11.5, fontWeight: 700,
                  background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "#ffffff",
                  border: "none", borderRadius: 6, cursor: "pointer"
                }}
              >
                Inspect Sample Float ({allList[0]?.platform_number || allList[0]?.instrument_id}) →
              </button>
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
            hideInstrumentList={true}
            hideHeaderCard={false}
          />
        )}
      </div>

      {/* ── Right Column: Telemetry & In-Situ Reading Summary Sidebar ── */}
      <div className="argo-summary-sidebar">
        <InstrumentSummaryPanel
          profile={profile}
          modelProfile={modelProfile}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}
