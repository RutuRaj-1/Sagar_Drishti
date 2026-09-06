import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { colorForValue, paletteForVariable } from "../utils/colormap.js";

// Cesium static assets served from public/cesium/
window.CESIUM_BASE_URL = "/cesium";
Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6MjY5MzcsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJnYyJdLCJpYXQiOjE1ODc0MjU0MjN9.9bnz0y5wbmFXk3DLPIDe3C_Y1wOhRnkp98k5T5sBFZ0";

// TASK 1: CARTO API Key
const CARTO_API_KEY = "cb1_2zcn_1_625cdb460e751685fabe1734";
const CARTO_VOYAGER_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=" + CARTO_API_KEY;

// ESRI Satellite Imagery - Natural Earth brown & green land + blue oceans (exact 2D Leaflet match)
const ESRI_IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_BOUNDARIES_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

// Indian Ocean Observation Domain (matches 2D Leaflet map)
const DOMAIN = { south: -20.0, north: 32.0, west: 40.0, east: 105.0 };

export default function CesiumRegionalView({
  surface,
  palette,
  colorScale,
  colorMin,
  colorMax,
  layerOpacity = 0.85,
  instruments = [],
  gliders = [],
  hfRadarStations = [],
  ramaBuoys = [],
  currentVectors = null,
  showCurrents = false,
  onSelectInstrument,
  selectedInstrumentId,
}) {
  const mountRef = useRef(null);
  const viewerRef = useRef(null);
  const entitiesRef = useRef([]);
  const surfaceLayerRef = useRef(null);
  const baseLayersRef = useRef([]);

  const [basemapStyle, setBasemapStyle] = useState("earthly"); // "earthly" | "carto"
  const [viewPreset, setViewPreset] = useState("horizon"); // "horizon" | "nadir"

  // Function to apply chosen basemap
  const applyBasemap = useCallback((viewer, style) => {
    if (!viewer || viewer.isDestroyed()) return;

    baseLayersRef.current.forEach((layer) => {
      try {
        if (viewer.imageryLayers.contains(layer)) {
          viewer.imageryLayers.remove(layer);
        }
      } catch (_) {}
    });
    baseLayersRef.current = [];

    if (style === "earthly") {
      // 1. ESRI Satellite - brown & green continents, vibrant blue oceans (Tasks 3 & 4)
      try {
        const esriProvider = new Cesium.UrlTemplateImageryProvider({
          url: ESRI_IMAGERY_URL,
          credit: new Cesium.Credit("Esri World Imagery, Maxar, Earthstar"),
          minimumLevel: 0,
          maximumLevel: 19,
          tileWidth: 256,
          tileHeight: 256,
        });
        const esriLayer = viewer.imageryLayers.addImageryProvider(esriProvider, 0);
        baseLayersRef.current.push(esriLayer);
      } catch (err) {
        console.warn("ESRI provider failed:", err);
      }

      // 2. Political boundaries & place names overlay
      try {
        const boundsProvider = new Cesium.UrlTemplateImageryProvider({
          url: ESRI_BOUNDARIES_URL,
          minimumLevel: 0,
          maximumLevel: 19,
          tileWidth: 256,
          tileHeight: 256,
        });
        const boundsLayer = viewer.imageryLayers.addImageryProvider(boundsProvider, 1);
        boundsLayer.alpha = 0.85;
        baseLayersRef.current.push(boundsLayer);
      } catch (_) {}
    } else {
      // CARTO Voyager with API key (Task 1)
      try {
        const cartoProvider = new Cesium.UrlTemplateImageryProvider({
          url: CARTO_VOYAGER_URL,
          subdomains: ["a", "b", "c", "d"],
          credit: new Cesium.Credit("CARTO / OpenStreetMap"),
          minimumLevel: 0,
          maximumLevel: 18,
          tileWidth: 256,
          tileHeight: 256,
        });
        const cartoLayer = viewer.imageryLayers.addImageryProvider(cartoProvider, 0);
        baseLayersRef.current.push(cartoLayer);
      } catch (err) {
        console.warn("CARTO Voyager failed:", err);
      }
    }
  }, []);

  // Camera presets
  const setCameraPreset = useCallback((viewer, preset) => {
    if (!viewer || viewer.isDestroyed()) return;

    if (preset === "horizon") {
      // 3D perspective centered over Indian Ocean with curvature & horizon
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(75.0, 7.0, 6500000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-72),
          roll: 0,
        },
        duration: 1.2,
      });
    } else if (preset === "nadir") {
      // Direct top-down view centered on the Indian Ocean regional domain
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(75.0, 8.0, 7200000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
        duration: 1.2,
      });
    }
    setViewPreset(preset);
  }, []);

  // Initialize Viewer
  useEffect(() => {
    if (!mountRef.current || viewerRef.current) return;

    let viewer = null;
    let clickHandler = null;

    try {
      viewer = new Cesium.Viewer(mountRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        geocoder: false,
        infoBox: false,
        selectionIndicator: false,
        sceneMode: Cesium.SceneMode.SCENE3D,
        requestRenderMode: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        navigationInstructionsInitiallyVisible: false,
      });

      viewer.imageryLayers.removeAll();
      applyBasemap(viewer, "earthly");

      // Realistic Earthly atmosphere & depth
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0d2847");

      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.skyAtmosphere.saturationShift = 0.25;
      viewer.scene.skyAtmosphere.brightnessShift = 0.08;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.00015;
      viewer.scene.sun.show = true;
      viewer.scene.moon.show = false;

      const ctrl = viewer.scene.screenSpaceCameraController;
      ctrl.enableTilt = true;
      ctrl.enableRotate = true;
      ctrl.enableZoom = true;
      ctrl.enableTranslate = true;
      ctrl.minimumZoomDistance = 150000;
      ctrl.maximumZoomDistance = 25000000;

      // Initial camera: 3D perspective centered on Indian Ocean with curved horizon and subcontinent
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(75.0, 7.0, 6500000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-72),
          roll: 0,
        },
      });

      // Domain Bounding Box in glowing cyan (matching 2D Leaflet DOMAIN)
      viewer.entities.add({
        name: "Regional Domain Bounding Box",
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            DOMAIN.west, DOMAIN.south,
            DOMAIN.east, DOMAIN.south,
            DOMAIN.east, DOMAIN.north,
            DOMAIN.west, DOMAIN.north,
            DOMAIN.west, DOMAIN.south,
          ]),
          width: 2.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.fromCssColorString("#00d4f0"),
          }),
          clampToGround: true,
        },
      });

      // Click handler
      clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      clickHandler.setInputAction((mv) => {
        const p = viewer.scene.pick(mv.position);
        if (Cesium.defined(p) && p.id && p.id.properties) {
          const id = p.id.properties.instrumentId && p.id.properties.instrumentId.getValue();
          if (id && onSelectInstrument) onSelectInstrument(id);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      viewerRef.current = viewer;
    } catch (err) {
      console.error("CesiumRegionalView init error:", err);
    }

    return () => {
      if (clickHandler) {
        try { clickHandler.destroy(); } catch (_) {}
      }
      if (viewer && !viewer.isDestroyed()) {
        try { viewer.destroy(); } catch (_) {}
      }
      viewerRef.current = null;
    };
  }, [applyBasemap, onSelectInstrument]);

  // Handle Basemap Toggle
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    applyBasemap(viewer, basemapStyle);
  }, [basemapStyle, applyBasemap]);

  // 3D Surface Heatmap Layer draped on the ocean
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (surfaceLayerRef.current) {
      try {
        if (viewer.imageryLayers.contains(surfaceLayerRef.current)) {
          viewer.imageryLayers.remove(surfaceLayerRef.current);
        }
      } catch (_) {}
      surfaceLayerRef.current = null;
    }

    if (!surface || !surface.lat || !surface.lon || !surface.values) return;

    const { lat, lon, values, min_value, max_value } = surface;
    const nLat = lat.length;
    const nLon = lon.length;
    if (!nLat || !nLon) return;

    const lo = colorMin ?? min_value;
    const hi = colorMax ?? max_value;
    const pal = palette || paletteForVariable(surface.variable);
    const cs = colorScale || "linear";

    const canvas = document.createElement("canvas");
    canvas.width = nLon;
    canvas.height = nLat;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(nLon, nLat);
    const data = imageData.data;

    for (let latI = 0; latI < nLat; latI++) {
      const row = nLat - 1 - latI;
      for (let lonJ = 0; lonJ < nLon; lonJ++) {
        const val = values[latI]?.[lonJ];
        const idx = (row * nLon + lonJ) * 4;
        if (val === null || val === undefined || isNaN(val)) {
          data[idx] = data[idx + 1] = data[idx + 2] = 0;
          data[idx + 3] = 0;
        } else {
          const [r, g, b] = colorForValue(val, lo, hi, pal, cs);
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = Math.round(layerOpacity * 240);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const minLat = Math.min(...lat);
    const maxLat = Math.max(...lat);
    const minLon = Math.min(...lon);
    const maxLon = Math.max(...lon);

    try {
      const surfaceProvider = new Cesium.SingleTileImageryProvider({
        url: canvas.toDataURL("image/png"),
        rectangle: Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat),
      });
      const layer = viewer.imageryLayers.addImageryProvider(surfaceProvider);
      layer.alpha = layerOpacity;
      surfaceLayerRef.current = layer;
    } catch (err) {
      console.warn("Failed to drape 3D surface raster:", err);
    }
  }, [surface, palette, colorScale, colorMin, colorMax, layerOpacity]);

  // Instruments markers
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    entitiesRef.current.forEach((e) => {
      try {
        if (viewer.entities.contains(e)) viewer.entities.remove(e);
      } catch (_) {}
    });
    entitiesRef.current = [];

    const all = [
      ...instruments.map((i) => ({ ...i, kind: "argo" })),
      ...gliders.map((g) => ({ ...g, kind: "glider" })),
      ...(ramaBuoys || []).map((b) => ({ ...b, instrument_id: b.buoy_id, kind: "buoy" })),
      ...(hfRadarStations || []).map((s) => ({ ...s, instrument_id: s.station_id, kind: "hfradar" })),
    ];

    all.forEach((inst) => {
      const lat = parseFloat(inst.latitude);
      const lon = parseFloat(inst.longitude);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

      const isSel = inst.instrument_id === selectedInstrumentId;
      const hasBGC = inst.bgc_params && inst.bgc_params.length > 0;
      let col =
        inst.kind === "glider" ? "#00d4f0" :
        inst.kind === "buoy" ? "#f59e0b" :
        inst.kind === "hfradar" ? "#ef4444" :
        hasBGC ? "#55efc4" :
        "#fdcb6e";
      if (isSel) col = "#ffffff";

      const ent = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 500),
        point: {
          pixelSize: isSel ? 16 : 9,
          color: Cesium.Color.fromCssColorString(col).withAlpha(0.92),
          outlineColor: Cesium.Color.fromCssColorString(isSel ? "#00d4f0" : "#111111"),
          outlineWidth: isSel ? 3 : 1.5,
          scaleByDistance: new Cesium.NearFarScalar(4e5, 1.4, 5e6, 0.5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: isSel ? {
          text: inst.platform_number || String(inst.instrument_id) || "INST",
          font: "12px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        } : undefined,
        properties: { instrumentId: inst.instrument_id, kind: inst.kind, latitude: lat, longitude: lon },
      });
      entitiesRef.current.push(ent);
    });

    try { viewer.scene.requestRender(); } catch (_) {}
  }, [instruments, gliders, ramaBuoys, hfRadarStations, selectedInstrumentId]);

  // Current vectors
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !showCurrents || !currentVectors?.points) return;

    const maxSpd = currentVectors.max_speed || 1.0;

    function speedColor(t) {
      const stops = [
        [0, [30, 144, 255]],
        [0.25, [0, 212, 240]],
        [0.5, [50, 230, 120]],
        [0.75, [253, 203, 110]],
        [1.0, [255, 70, 70]],
      ];
      for (let i = 0; i < stops.length - 1; i++) {
        const [t0, c0] = stops[i];
        const [t1, c1] = stops[i + 1];
        if (t <= t1) {
          const f = (t - t0) / (t1 - t0);
          return Cesium.Color.fromBytes(
            Math.round(c0[0] + f * (c1[0] - c0[0])),
            Math.round(c0[1] + f * (c1[1] - c0[1])),
            Math.round(c0[2] + f * (c1[2] - c0[2])),
            200
          );
        }
      }
      return Cesium.Color.fromBytes(255, 70, 70, 200);
    }

    currentVectors.points.forEach((pt) => {
      const spdNorm = Math.min(1.0, pt.speed / maxSpd);
      if (spdNorm < 0.05) return;

      const color = speedColor(spdNorm);
      const angleRad = (pt.angle_deg * Math.PI) / 180;
      const len = 0.15 + spdNorm * 0.45;

      const entity = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            pt.lon, pt.lat,
            pt.lon + len * Math.cos(angleRad),
            pt.lat + len * Math.sin(angleRad),
          ]),
          width: 2,
          material: new Cesium.PolylineArrowMaterialProperty(color),
          clampToGround: true,
        },
      });

      entitiesRef.current.push(entity);
    });

    try { viewer.scene.requestRender(); } catch (_) {}
  }, [showCurrents, currentVectors]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#030814" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Floating Basemap & Perspective Controls */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          display: "flex",
          gap: 8,
          zIndex: 50,
          background: "rgba(10, 16, 35, 0.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(0, 212, 240, 0.3)",
          borderRadius: 8,
          padding: "6px 10px",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, color: "#8ca0ba", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Basemap:
        </span>
        <button
          onClick={() => setBasemapStyle("earthly")}
          style={{
            background: basemapStyle === "earthly" ? "rgba(0, 212, 240, 0.25)" : "transparent",
            color: basemapStyle === "earthly" ? "#00d4f0" : "#a2b4c7",
            border: basemapStyle === "earthly" ? "1px solid #00d4f0" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 5,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
            fontWeight: basemapStyle === "earthly" ? 700 : 500,
          }}
          title="ESRI World Imagery: Natural Earth Brown & Green Land + Deep Blue Water (2D Leaflet Match)"
        >
          🛰️ Earthly 3D (2D Match)
        </button>
        <button
          onClick={() => setBasemapStyle("carto")}
          style={{
            background: basemapStyle === "carto" ? "rgba(0, 212, 240, 0.25)" : "transparent",
            color: basemapStyle === "carto" ? "#00d4f0" : "#a2b4c7",
            border: basemapStyle === "carto" ? "1px solid #00d4f0" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 5,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
            fontWeight: basemapStyle === "carto" ? 700 : 500,
          }}
          title="CARTO Voyager Basemap with Authorized API Key"
        >
          🗺️ CARTO Voyager
        </button>

        <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

        <span style={{ fontSize: 11, color: "#8ca0ba", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          View:
        </span>
        <button
          onClick={() => setCameraPreset(viewerRef.current, "horizon")}
          style={{
            background: viewPreset === "horizon" ? "rgba(0, 212, 240, 0.25)" : "transparent",
            color: viewPreset === "horizon" ? "#00d4f0" : "#a2b4c7",
            border: viewPreset === "horizon" ? "1px solid #00d4f0" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 5,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
            fontWeight: viewPreset === "horizon" ? 700 : 500,
          }}
          title="3D Horizon Perspective"
        >
          🏔️ 3D Horizon
        </button>
        <button
          onClick={() => setCameraPreset(viewerRef.current, "nadir")}
          style={{
            background: viewPreset === "nadir" ? "rgba(0, 212, 240, 0.25)" : "transparent",
            color: viewPreset === "nadir" ? "#00d4f0" : "#a2b4c7",
            border: viewPreset === "nadir" ? "1px solid #00d4f0" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 5,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
            fontWeight: viewPreset === "nadir" ? 700 : 500,
          }}
          title="Top-Down Nadir View of Domain"
        >
          🌍 Nadir
        </button>
      </div>
    </div>
  );
}
