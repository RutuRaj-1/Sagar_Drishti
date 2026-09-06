import React, { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { colorForValue } from "../utils/colormap.js";

// Configure Cesium asset paths for Vite
window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium';

/**
 * CesiumGlobeView — Realistic 3D Earth Globe Mode
 * -----------------------------------------------
 * Google Earth-style spherical globe using Cesium.js with:
 *  - Real satellite imagery (Cesium World Imagery)
 *  - Natural Earth terrain (Cesium World Terrain)
 *  - Atmospheric glow and realistic lighting
 *  - Full world exploration (smooth zoom, pan, rotate)
 *  - Same data as Scene3D: Argo floats, gliders, ocean data
 *  - Same interactions: click markers, select variables, view profiles
 *
 * CONSUMES SAME STATE AS Scene3D - no duplicate fetching!
 */

// Set Cesium ion access token (free tier)
// Sign up at: https://ion.cesium.com/signup
// Replace with your token or use default for development
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiOGQzOWQ4Zi05YTg4LTRjNDMtYjdhZi0zMjE1NTg3MTM4YzUiLCJpZCI6MjU5NTkzLCJpYXQiOjE3NDY1NTYxNTl9.TRKLHjfDgC8VtX-uPQy_qF3_TUvKTW7CqvfOnR9JMZ8";

export default function CesiumGlobeView({
  surface,
  palette,
  colorScale,
  colorMin,
  colorMax,
  instruments = [],
  gliders = [],
  currentVectors = null,
  showCurrents = false,
  onSelectInstrument,
  selectedInstrumentId,
  layerOpacity = 0.85,
}) {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const entitiesRef = useRef([]);

  // ── Initialize Cesium Viewer once ────────────────────────────────────────
  useEffect(() => {
    if (!cesiumContainerRef.current || viewerRef.current) return;

    let viewer;
    let clickHandler;

    // Async initialization function
    const initViewer = async () => {
      // Create Cesium Viewer with realistic Earth settings
      viewer = new Cesium.Viewer(cesiumContainerRef.current, {
        // Imagery: Real satellite colors
        imageryProvider: await Cesium.IonImageryProvider.fromAssetId(2),
        // Terrain: Real elevation data
        terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1),
        // UI settings for clean appearance
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        homeButton: true,
        sceneModePicker: false,
        navigationHelpButton: false,
        geocoder: false,
        infoBox: false,
        selectionIndicator: false,
        // Scene mode: 3D globe (not 2D/2.5D)
        sceneMode: Cesium.SceneMode.SCENE3D,
        // Performance
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      });

      // Enable realistic lighting and atmosphere
      viewer.scene.globe.enableLighting = true; // Day/night shading based on sun
      viewer.scene.skyAtmosphere.show = true;   // Blue atmospheric glow
      viewer.scene.fog.enabled = true;           // Distance haze
      viewer.scene.fog.density = 0.0001;
      
      // Better visual quality
      viewer.scene.globe.depthTestAgainstTerrain = true; // Proper occlusion
      viewer.scene.highDynamicRange = true;              // Better color range

      // Start camera looking at Indian Ocean region
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(78.5, 14.0, 4500000), // lon, lat, height (meters)
        duration: 2.5,
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0
        }
      });

      // Click handler for marker selection
      clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      clickHandler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
          const instrumentId = pickedObject.id.properties.instrumentId?.getValue();
          if (instrumentId && onSelectInstrument) {
            onSelectInstrument(instrumentId);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      viewerRef.current = viewer;
    };

    initViewer().catch(console.error);

    // Cleanup on unmount
    return () => {
      if (clickHandler) {
        clickHandler.destroy();
      }
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, [onSelectInstrument]);

  // ── Render Argo floats and gliders as Cesium entities ────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewer.entities) return;

    // Remove existing markers
    entitiesRef.current.forEach(entity => {
      if (viewer.entities.contains(entity)) {
        viewer.entities.remove(entity);
      }
    });
    entitiesRef.current = [];

    // Combine all instruments
    const allInstruments = [
      ...instruments.map(i => ({ ...i, kind: "argo" })),
      ...gliders.map(g => ({ ...g, kind: "glider" })),
    ];

    if (!allInstruments.length) return;

    // Get color mapping function parameters
    const lo = colorMin ?? surface?.min_value ?? 0;
    const hi = colorMax ?? surface?.max_value ?? 1;
    const pal = palette || "thermal";

    allInstruments.forEach((inst) => {
      const isSelected = inst.instrument_id === selectedInstrumentId;
      const isGlider = inst.kind === "glider";
      const hasBGC = inst.bgc_params?.length > 0;

      // Determine color using existing colorForValue function
      let markerColor = "#fdcb6e"; // Default yellow for Argo
      if (isSelected) {
        markerColor = "#ffffff"; // White for selected
      } else if (isGlider) {
        markerColor = "#00d4f0"; // Cyan for gliders
      } else if (hasBGC) {
        markerColor = "#55efc4"; // Green for BGC floats
      }

      // Create Cesium entity at real lat/lon
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          inst.longitude,
          inst.latitude,
          0 // At Earth surface
        ),
        point: {
          pixelSize: isSelected ? 14 : isGlider ? 10 : 8,
          color: Cesium.Color.fromCssColorString(markerColor),
          outlineColor: Cesium.Color.fromCssColorString(isSelected ? "#00d4f0" : "#ffffff"),
          outlineWidth: isSelected ? 3 : 1.5,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.0, 8.0e6, 0.4),
        },
        label: isSelected ? {
          text: inst.platform_number || inst.instrument_id,
          font: "12px 'Inter', sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -15),
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.0, 8.0e6, 0.0),
        } : undefined,
        properties: {
          instrumentId: inst.instrument_id,
          kind: inst.kind,
          platformNumber: inst.platform_number || inst.instrument_id,
          latitude: inst.latitude,
          longitude: inst.longitude,
          timestamp: inst.timestamp,
        }
      });

      entitiesRef.current.push(entity);
    });

    // Request render update
    viewer.scene.requestRender();
  }, [instruments, gliders, selectedInstrumentId, surface, palette, colorMin, colorMax]);

  // ── Render current vectors as Cesium polylines (arrows) ──────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !showCurrents || !currentVectors?.points) return;

    const maxSpd = currentVectors.max_speed || 1.0;

    // Speed color gradient
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
          const r = Math.round(c0[0] + f * (c1[0] - c0[0]));
          const g = Math.round(c0[1] + f * (c1[1] - c0[1]));
          const b = Math.round(c0[2] + f * (c1[2] - c0[2]));
          return Cesium.Color.fromBytes(r, g, b, 200);
        }
      }
      return Cesium.Color.fromBytes(255, 70, 70, 200);
    }

    currentVectors.points.forEach((pt) => {
      const spdNorm = Math.min(1.0, pt.speed / maxSpd);
      if (spdNorm < 0.05) return;

      const color = speedColor(spdNorm);
      const angleRad = (pt.angle_deg * Math.PI) / 180;
      const len = 0.2 + spdNorm * 0.5; // Length in degrees

      const dLon = len * Math.cos(angleRad);
      const dLat = len * Math.sin(angleRad);

      const entity = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            pt.lon, pt.lat,
            pt.lon + dLon, pt.lat + dLat
          ]),
          width: 2,
          material: new Cesium.PolylineArrowMaterialProperty(color),
          clampToGround: true,
        }
      });

      entitiesRef.current.push(entity);
    });

    viewer.scene.requestRender();
  }, [showCurrents, currentVectors]);

  return (
    <div 
      ref={cesiumContainerRef} 
      style={{ 
        width: "100%", 
        height: "100%",
        position: "relative",
      }}
    />
  );
}
