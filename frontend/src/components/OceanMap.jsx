import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { colorForValue, paletteForVariable } from "../utils/colormap.js";
import { ARGO_PARAM_COLORS } from "../utils/colormap.js";

/**
 * OceanMap — 2D Choropleth GIS Map (Leaflet + CMEMS/4D Canvas Overlay + Current Vectors)
 * --------------------------------------------------------------------------------------
 * Features:
 *  - High-contrast Esri Dark Matter Marine Base Tiles
 *  - Raster Canvas Colormap Overlay (Opacity controllable)
 *  - Animated/Static 2D Current Vector Flow Field (Arrows showing magnitude & direction)
 *  - Argo Float CircleMarkers & Underwater Glider Markers with popups
 *  - Interactive Click-to-inspect and Coordinate Hover
 */

// SAGAR-DRISHTI operational domain — Indian Peninsula, Bay of Bengal & Arabian Sea
// Coordinates based on CMEMS dataset coverage (Image 2 bounds)
const DOMAIN = {
  south: 5.0,      // South tip (Sri Lanka, around 6°N latitude)
  north: 24.0,     // North (India, around 24°N - Gujarat/West Bengal)
  west: 66.0,      // West (near Oman coast, Arabian Sea)
  east: 97.0,      // East (Myanmar coast, Bay of Bengal)
  // This creates a rectangle: 5-24°N × 66-97°E covering full operational domain
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function OceanMap({
  surface,
  palette,
  colorMin,
  colorMax,
  colorScale,
  layerOpacity = 0.85,
  onPointClick,
  onHover,
  instruments = [],
  gliders = [],
  hfRadarStations = [],
  hfRadarCurrents = [],
  ramaBuoys = [],
  showHFRadar = true,
  showRAMABuoys = true,
  currentVectors = null,
  showCurrents = false,
  onSelectInstrument,
  selectedInstrumentId,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const markersRef = useRef([]);
  const tooltipRef = useRef(null);
  const stateRef = useRef({});

  // ── Initialize Leaflet map once ──────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [15.0, 80.5],
      zoom: 5,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      maxBounds: undefined,
      maxBoundsViscosity: 0.0,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    // Natural Earth-style satellite imagery basemap with blue oceans and realistic landmass colors
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
        maxZoom: 18,
        minZoom: 4,
        opacity: 1.0,
      }
    ).addTo(map);

    // Overlay with political boundaries, place names, and ocean labels for clarity
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "",
        maxZoom: 18,
        minZoom: 4,
        zIndex: 400,
        opacity: 0.8,
      }
    ).addTo(map);

    // Domain boundary — dashed border only, no fill (so heatmap colors show through cleanly)
    L.rectangle(
      [
        [DOMAIN.south, DOMAIN.west],
        [DOMAIN.north, DOMAIN.east],
      ],
      {
        color: "#00d4f0",
        weight: 2,
        fill: false,
        dashArray: "10 6",
        interactive: false,
      }
    ).addTo(map);

    // Regional ocean labels for better context on natural basemap
    [
      { pos: [DOMAIN.north, (DOMAIN.west + DOMAIN.east) / 2], text: "SAGAR-DRISHTI Domain: Bay of Bengal + Arabian Sea" },
      { pos: [15.5, 70], text: "🌊 Arabian Sea" },
      { pos: [15.5, 87], text: "🌊 Bay of Bengal" },
    ].forEach(({ pos, text }) => {
      L.marker(pos, { opacity: 0 })
        .addTo(map)
        .bindTooltip(text, { permanent: true, className: "domain-label", direction: "center" });
    });

    const tooltip = L.tooltip({
      permanent: false,
      className: "ocean-tooltip",
      direction: "top",
      offset: [0, -8],
    });
    tooltipRef.current = tooltip;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      if (e.originalEvent.target.closest("[data-inst]")) return;
      if (onPointClick) onPointClick(lat, lng);
    });

    map.on("mousemove", (e) => {
      const { lat, lng } = e.latlng;
      const { surfaceData } = stateRef.current;
      if (!surfaceData) return;

      const { lat: lats, lon: lons, values } = surfaceData;
      const latStep = (lats[1] - lats[0]) || 0.083;
      const lonStep = (lons[1] - lons[0]) || 0.083;
      const latIdx = Math.round((lat - lats[0]) / latStep);
      const lonIdx = Math.round((lng - lons[0]) / lonStep);
      const clLat = Math.max(0, Math.min(lats.length - 1, latIdx));
      const clLon = Math.max(0, Math.min(lons.length - 1, lonIdx));
      const val = values[clLat]?.[clLon];

      if (onHover) onHover(lat, lng, val ?? null);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Render CMEMS / 4D raster canvas overlay ──────────────────────────────
  useEffect(() => {
    if (!surface || !mapRef.current) return;

    const map = mapRef.current;
    const { lat, lon, values, min_value, max_value } = surface;
    const nLat = lat.length;
    const nLon = lon.length;

    const lo = colorMin ?? min_value;
    const hi = colorMax ?? max_value;
    const pal = palette || paletteForVariable(surface.variable);
    const cs = colorScale || "linear";

    stateRef.current = { surfaceData: surface, lo, hi, pal, cs };

    const canvas = document.createElement("canvas");
    canvas.width = nLon;
    canvas.height = nLat;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(nLon, nLat);
    const data = imageData.data;

    for (let latI = 0; latI < nLat; latI++) {
      const row = nLat - 1 - latI;
      const latVal = lat[latI];

      for (let lonJ = 0; lonJ < nLon; lonJ++) {
        const lonVal = lon[lonJ];
        const val = values[latI]?.[lonJ];
        const idx = (row * nLon + lonJ) * 4;

        // Only render pixels inside the DOMAIN rectangle
        const inDomain = (
          latVal >= DOMAIN.south && latVal <= DOMAIN.north &&
          lonVal >= DOMAIN.west  && lonVal <= DOMAIN.east
        );

        if (!inDomain || val === null || val === undefined || isNaN(val)) {
          data[idx] = data[idx + 1] = data[idx + 2] = 0;
          data[idx + 3] = 0;
        } else {
          const [r, g, b] = colorForValue(val, lo, hi, pal, cs);
          data[idx]     = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = Math.round(layerOpacity * 255);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const dataUrl = canvas.toDataURL("image/png");
    // Overlay bounds match the full data extent — transparent pixels handle clipping
    const bounds = L.latLngBounds(
      [lat[0], lon[0]],
      [lat[nLat - 1], lon[nLon - 1]]
    );

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }
    const overlay = L.imageOverlay(dataUrl, bounds, {
      opacity: 1.0,      // full opacity on the image; per-pixel alpha handles transparency
      interactive: false,
      zIndex: 300,
    });
    overlay.addTo(map);
    overlayRef.current = overlay;
  }, [surface, palette, colorMin, colorMax, colorScale, layerOpacity]);

  // ── Render 2D Current Vector Arrows Layer (with proper arrowheads) ────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (vectorLayerRef.current) {
      map.removeLayer(vectorLayerRef.current);
      vectorLayerRef.current = null;
    }

    if (!showCurrents || !currentVectors?.points) return;

    const layerGroup = L.layerGroup();
    const points = currentVectors.points;
    const maxSpd = currentVectors.max_speed || 1.0;

    // 5-stop speed gradient: slow(blue) → cyan → lime → amber → fast(red)
    function speedColor(t) {
      const stops = [
        [0,    [30,  144, 255]],
        [0.25, [0,   212, 240]],
        [0.5,  [50,  230, 120]],
        [0.75, [253, 203, 110]],
        [1.0,  [255,  70,  70]],
      ];
      for (let i = 0; i < stops.length - 1; i++) {
        const [t0, c0] = stops[i];
        const [t1, c1] = stops[i + 1];
        if (t <= t1) {
          const f = (t - t0) / (t1 - t0);
          return `rgb(${Math.round(c0[0] + f*(c1[0]-c0[0]))},${Math.round(c0[1] + f*(c1[1]-c0[1]))},${Math.round(c0[2] + f*(c1[2]-c0[2]))})`;
        }
      }
      return "rgb(255,70,70)";
    }

    points.forEach((pt) => {
      const spdNorm = Math.min(1.0, pt.speed / maxSpd);
      if (spdNorm < 0.05) return; // skip near-zero currents

      const color = speedColor(spdNorm);
      const opacity = 0.5 + spdNorm * 0.45;

      // angle_deg: direction the current flows TOWARD (0=East, 90=North)
      const angleRad = (pt.angle_deg * Math.PI) / 180;
      const baseLen = 0.16 + spdNorm * 0.38;
      const dLon = baseLen * Math.cos(angleRad);
      const dLat = baseLen * Math.sin(angleRad);

      const start = [pt.lat, pt.lon];
      const end   = [pt.lat + dLat, pt.lon + dLon];

      // Shaft
      const shaft = L.polyline([start, end], {
        color,
        weight: 1.2 + spdNorm * 2.0,
        opacity,
        lineCap: "round",
        interactive: false,
      });
      layerGroup.addLayer(shaft);

      // Arrowhead: rotated CSS triangle via divIcon
      const headSize = 5 + spdNorm * 7;
      const halfW = Math.round(headSize * 0.55);
      // CSS border-triangle points upward; rotate so "up" aligns with current direction
      // angle_deg measured from East CCW; CSS rotate(0deg) = pointing up = North = 90° in oceanographic
      const rotateDeg = -(pt.angle_deg - 90);
      const arrowIcon = L.divIcon({
        html: `<div style="
          width:0;height:0;
          border-left:${halfW}px solid transparent;
          border-right:${halfW}px solid transparent;
          border-bottom:${Math.round(headSize)}px solid ${color};
          opacity:${opacity.toFixed(2)};
          transform:rotate(${rotateDeg}deg);
          transform-origin:50% 100%;
        "></div>`,
        className: "",
        iconSize: [halfW * 2, headSize],
        iconAnchor: [halfW, headSize / 2],
      });

      const arrowMarker = L.marker(end, {
        icon: arrowIcon,
        interactive: false,
        zIndexOffset: -100,
      });
      layerGroup.addLayer(arrowMarker);
    });

    layerGroup.addTo(map);
    vectorLayerRef.current = layerGroup;
  }, [showCurrents, currentVectors]);

  // ── Render Argo & Glider Markers ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const allInstruments = [
      ...instruments.map(i => ({ ...i, kind: "argo" })),
      ...gliders.map(g => ({ ...g, kind: "glider" })),
      ...(showRAMABuoys ? ramaBuoys.map(b => ({ ...b, instrument_id: b.buoy_id, kind: "buoy" })) : []),
      ...(showHFRadar ? hfRadarStations.map(st => ({ ...st, instrument_id: st.station_id, kind: "hfradar" })) : []),
    ];

    if (!allInstruments.length) return;

    allInstruments.forEach((inst) => {
      const isSelected = inst.instrument_id === selectedInstrumentId;
      const isGlider = inst.kind === "glider";
      const isBuoy = inst.kind === "buoy";
      const isHFRadar = inst.kind === "hfradar";
      const hasBGC = inst.bgc_params?.length > 0;

      const fillColor = isBuoy ? "#f1c40f" : isHFRadar ? "#ff7675" : isGlider ? "#00d4f0" : hasBGC ? "#55efc4" : "#fdcb6e";
      const borderColor = isSelected ? "#ffffff" : "rgba(255,255,255,0.6)";

      const marker = L.circleMarker([inst.latitude, inst.longitude], {
        radius: isSelected ? 10 : isBuoy ? 9 : isHFRadar ? 9 : isGlider ? 8 : hasBGC ? 7 : 6,
        fillColor,
        color: borderColor,
        weight: isSelected ? 2.5 : 1.2,
        opacity: 1,
        fillOpacity: isSelected ? 1 : 0.85,
      });

      const typeLabel = isBuoy ? "⚓ RAMA Buoy" : isHFRadar ? "📡 HF Radar" : isGlider ? "🌊 Glider" : "🔴 Float";


      marker.bindPopup(
        `<div style="font-family:'Inter',sans-serif;font-size:11px;min-width:180px;">
          <div style="font-weight:800;font-size:13px;color:${fillColor};margin-bottom:5px;">
            ${typeLabel} ${inst.platform_number || inst.instrument_id}
          </div>
          <div style="color:#9ec4db;margin-bottom:3px;">
            📍 ${inst.latitude?.toFixed(3)}°N, ${inst.longitude?.toFixed(3)}°E
          </div>
          <div style="color:#9ec4db;margin-bottom:6px;">
            📅 ${inst.timestamp?.slice(0, 10) || "—"}
          </div>
          <div style="margin-top:8px;">
            <button onclick="window._argoSelect('${inst.instrument_id}')"
              style="background:linear-gradient(135deg,#0097a7,#00d4f0);color:#030d16;border:none;padding:5px 10px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;width:100%;">
              View Depth Profile →
            </button>
          </div>
        </div>`,
        { className: "argo-popup", maxWidth: 220 }
      );

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectInstrument) onSelectInstrument(inst.instrument_id);
      });

      marker.addTo(map);

      if (isSelected) {
        const ring = L.circleMarker([inst.latitude, inst.longitude], {
          radius: 16,
          fillColor: "transparent",
          color: fillColor,
          weight: 1.5,
          opacity: 0.5,
          fillOpacity: 0,
          className: "argo-pulse-ring",
        });
        ring.addTo(map);
        markersRef.current.push(ring);
      }

      markersRef.current.push(marker);
    });

    window._argoSelect = (id) => {
      if (onSelectInstrument) onSelectInstrument(id);
    };
  }, [instruments, gliders, selectedInstrumentId]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%", background: "#a4c8e1" }}
      />
    </div>
  );
}
