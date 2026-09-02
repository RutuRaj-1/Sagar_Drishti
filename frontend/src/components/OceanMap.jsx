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

const DOMAIN = {
  south: 5.0,
  north: 23.0,
  west: 60.0,
  east: 97.0,
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
      center: [14.0, 78.0],
      zoom: 5,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [
        [DOMAIN.south - 5, DOMAIN.west - 5],
        [DOMAIN.north + 5, DOMAIN.east + 5],
      ],
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
        maxZoom: 16,
        minZoom: 4,
        opacity: 1.0,
      }
    ).addTo(map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "",
        maxZoom: 16,
        minZoom: 4,
        zIndex: 400,
        opacity: 0.95,
      }
    ).addTo(map);

    // Domain boundary
    L.rectangle(
      [
        [DOMAIN.south, DOMAIN.west],
        [DOMAIN.north, DOMAIN.east],
      ],
      {
        color: "rgba(0, 212, 240, 0.6)",
        weight: 1.5,
        fill: false,
        dashArray: "6 4",
      }
    ).addTo(map);

    [
      { pos: [DOMAIN.north, (DOMAIN.west + DOMAIN.east) / 2], text: "SAGAR-DRISHTI Domain: Bay of Bengal + Arabian Sea" },
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
      for (let lonJ = 0; lonJ < nLon; lonJ++) {
        const val = values[latI]?.[lonJ];
        const idx = (row * nLon + lonJ) * 4;
        if (val === null || val === undefined) {
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
    const bounds = L.latLngBounds(
      [lat[0], lon[0]],
      [lat[nLat - 1], lon[nLon - 1]]
    );

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }
    const overlay = L.imageOverlay(dataUrl, bounds, {
      opacity: layerOpacity,
      interactive: false,
      zIndex: 300,
    });
    overlay.addTo(map);
    overlayRef.current = overlay;
  }, [surface, palette, colorMin, colorMax, colorScale, layerOpacity]);

  // ── Render 2D Current Vector Arrows Layer ────────────────────────────────
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

    points.forEach((pt) => {
      const rad = (pt.angle_deg * Math.PI) / 180;
      const spdNorm = Math.min(1.0, pt.speed / maxSpd);
      
      // Vector arrow length
      const len = 0.22 + spdNorm * 0.45;
      const dLat = len * Math.sin(rad);
      const dLon = len * Math.cos(rad);

      const start = [pt.lat, pt.lon];
      const end = [pt.lat + dLat, pt.lon + dLon];

      // Arrow color: cyan for moderate, yellow/amber for high speed
      const color = spdNorm > 0.6 ? "#fdcb6e" : "#00d4f0";

      // Draw vector shaft
      const line = L.polyline([start, end], {
        color,
        weight: 1.5 + spdNorm * 1.5,
        opacity: 0.85,
        interactive: false,
      });
      layerGroup.addLayer(line);

      // Arrow tip dot
      const tip = L.circleMarker(end, {
        radius: 2 + spdNorm * 2,
        fillColor: color,
        color: "#ffffff",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1,
        interactive: false,
      });
      layerGroup.addLayer(tip);
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
    ];

    if (!allInstruments.length) return;

    allInstruments.forEach((inst) => {
      const isSelected = inst.instrument_id === selectedInstrumentId;
      const isGlider = inst.kind === "glider";
      const hasBGC = inst.bgc_params?.length > 0;

      const fillColor = isGlider ? "#00d4f0" : hasBGC ? "#55efc4" : "#fdcb6e";
      const borderColor = isSelected ? "#ffffff" : "rgba(255,255,255,0.6)";

      const marker = L.circleMarker([inst.latitude, inst.longitude], {
        radius: isSelected ? 9 : isGlider ? 8 : hasBGC ? 7 : 6,
        fillColor,
        color: borderColor,
        weight: isSelected ? 2.5 : 1.2,
        opacity: 1,
        fillOpacity: isSelected ? 1 : 0.85,
      });

      const typeLabel = isGlider ? "🌊 Glider" : "🔴 Float";

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
        style={{ width: "100%", height: "100%", background: "#030d16" }}
      />
    </div>
  );
}
