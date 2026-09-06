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

// ESRI Satellite Imagery - Natural Earth brown/green land and deep blue oceans (exact 2D Leaflet match)
const ESRI_IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_BOUNDARIES_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

export default function CesiumGlobeView({
  surface,
  palette,
  colorScale,
  colorMin,
  colorMax,
  instruments = [],
  gliders = [],
  hfRadarStations = [],
  ramaBuoys = [],
  currentVectors = null,
  showCurrents = false,
  onSelectInstrument,
  selectedInstrumentId,
  layerOpacity = 0.85,
}) {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const entitiesRef = useRef([]);
  const surfaceLayerRef = useRef(null);
  const baseLayersRef = useRef([]);

  const [basemapStyle, setBasemapStyle] = useState("earthly"); // "earthly" | "carto"

  // Function to apply chosen basemap
  const applyBasemap = useCallback((viewer, style) => {
    if (!viewer || viewer.isDestroyed()) return;

    // Remove existing base imagery layers
    baseLayersRef.current.forEach((layer) => {
      try {
        if (viewer.imageryLayers.contains(layer)) {
          viewer.imageryLayers.remove(layer);
        }
      } catch (_) {}
    });
    baseLayersRef.current = [];

    if (style === "earthly") {
      // 1. ESRI Satellite - brown & green land + blue oceans (Task 4)
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
        console.warn("ESRI satellite provider failed:", err);
      }

      // 2. National borders and geographical reference labels
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
      // CARTO Voyager using the provided API Key (Task 1)
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
        console.warn("CARTO Voyager provider failed:", err);
      }
    }
  }, []);

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!cesiumContainerRef.current || viewerRef.current) return;

    let viewer = null;
    let clickHandler = null;

    try {
      viewer = new Cesium.Viewer(cesiumContainerRef.current, {
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

      // Clear Cesium default Bing/Ion imagery
      viewer.imageryLayers.removeAll();

      // Apply initial basemap (Earthly satellite with brown/green land & blue water)
      applyBasemap(viewer, "earthly");

      // Globe space atmosphere and appearance
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0e2b4d");

      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.skyAtmosphere.saturationShift = 0.2;
      viewer.scene.skyAtmosphere.brightnessShift = 0.05;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.00015;
      viewer.scene.sun.show = true;
      viewer.scene.moon.show = false;

      // TASK 2:
      // 1) Earth placed at the CENTER of the screen
      // 2) Size 3X from previous size (fills ~75% viewport height at altitude ~11,200 km)
      // 3) Only rotatable from all angles (no travelling / panning away from center)
      // 4) Revolution and rotation possible from each angle (constrainedAxis = undefined)
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(78.0, 15.0, 11200000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90), // Straight down -> perfectly centered
          roll: 0,
        },
      });

      const ctrl = viewer.scene.screenSpaceCameraController;
      ctrl.enableRotate = true;
      ctrl.enableTilt = true;
      ctrl.enableZoom = true;
      ctrl.enableTranslate = false; // NO travelling/panning off-screen: keeps globe centered!
      ctrl.constrainedAxis = undefined; // Free 360-degree rotation over poles & all angles!
      ctrl.minimumZoomDistance = 800000;
      ctrl.maximumZoomDistance = 35000000;

      // Click handler for instruments
      clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      clickHandler.setInputAction((movement) => {
        const picked = viewer.scene.pick(movement.position);
        if (Cesium.defined(picked) && picked.id?.properties) {
          const id = picked.id.properties.instrumentId?.getValue();
          if (id && onSelectInstrument) onSelectInstrument(id);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      viewerRef.current = viewer;
    } catch (err) {
      console.error("Cesium Viewer initialization error:", err);
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

  // Center Globe button callback
  const handleCenterGlobe = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(78.0, 15.0, 11200000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 1.2,
    });
  };

  // Render Surface Heatmap Overlay in 3D (draped over the ocean)
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

  // Render Instrument markers (Argo, Gliders, RAMA, HF Radar)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !viewer.entities) return;

    entitiesRef.current.forEach((e) => {
      try {
        if (viewer.entities.contains(e)) viewer.entities.remove(e);
      } catch (_) {}
    });
    entitiesRef.current = [];

    const allInstruments = [
      ...instruments.map((i) => ({ ...i, kind: "argo" })),
      ...gliders.map((g) => ({ ...g, kind: "glider" })),
      ...(ramaBuoys || []).map((b) => ({ ...b, instrument_id: b.buoy_id, kind: "buoy" })),
      ...(hfRadarStations || []).map((s) => ({ ...s, instrument_id: s.station_id, kind: "hfradar" })),
    ];

    allInstruments.forEach((inst) => {
      const lat = parseFloat(inst.latitude);
      const lon = parseFloat(inst.longitude);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

      const isSelected = inst.instrument_id === selectedInstrumentId;
      const hasBGC = inst.bgc_params?.length > 0;

      let markerColor =
        inst.kind === "glider" ? "#00d4f0" :
        inst.kind === "buoy" ? "#f59e0b" :
        inst.kind === "hfradar" ? "#ef4444" :
        hasBGC ? "#55efc4" :
        "#fdcb6e";
      if (isSelected) markerColor = "#ffffff";

      const pixelSize = isSelected ? 15 : inst.kind === "glider" ? 10 : 8;

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 500),
        point: {
          pixelSize,
          color: Cesium.Color.fromCssColorString(markerColor).withAlpha(0.92),
          outlineColor: Cesium.Color.fromCssColorString(isSelected ? "#00d4f0" : "#1a1a2e"),
          outlineWidth: isSelected ? 3 : 1.5,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.2, 1.0e7, 0.4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: isSelected ? {
          text: inst.platform_number || String(inst.instrument_id) || `${lat.toFixed(1)},${lon.toFixed(1)}`,
          font: "12px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        } : undefined,
        properties: {
          instrumentId: inst.instrument_id,
          kind: inst.kind,
          platformNumber: inst.platform_number || inst.instrument_id,
          latitude: lat,
          longitude: lon,
        },
      });

      entitiesRef.current.push(entity);
    });

    try { viewer.scene.requestRender(); } catch (_) {}
  }, [instruments, gliders, ramaBuoys, hfRadarStations, selectedInstrumentId]);

  // Render Ocean Current Vectors
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
      <div ref={cesiumContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Floating Controls Overlay */}
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
          title="ESRI World Imagery: Natural Earth Brown & Green Land + Deep Blue Water"
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
        <button
          onClick={handleCenterGlobe}
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "#e0e8ff",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 5,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
            marginLeft: 4,
          }}
          title="Reset Earth to Center"
        >
          🎯 Re-Center
        </button>
      </div>
    </div>
  );
}
