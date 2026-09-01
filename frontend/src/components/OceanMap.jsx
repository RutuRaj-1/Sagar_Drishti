import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { colorForValue, paletteForVariable } from "../utils/colormap.js";
import { ARGO_PARAM_COLORS } from "../utils/colormap.js";

/**
 * OceanMap — 2D Choropleth Map (Leaflet base + CMEMS canvas overlay)
 * -------------------------------------------------------------------
 * Uses Leaflet.js for the geographic base map (correct India/Sri Lanka
 * coastlines, geographic tiles) and overlays the CMEMS data as a
 * semi-transparent canvas layer.
 *
 * Features:
 *  - CartoDB Dark Matter base tiles for the correct geographic context
 *  - CMEMS data rendered as a transparent canvas overlay (opacity 0.75)
 *  - India, Sri Lanka, Bangladesh, Pakistan coastlines from tile server
 *  - Argo float markers as Leaflet CircleMarkers with color-coded icons
 *  - Click → lat/lon → CMEMS time-series
 *  - Hover tooltip with value + coordinates
 *  - Selected float shows animated pulse ring
 */

// Domain bounds: CMEMS Bay of Bengal + Arabian Sea
const DOMAIN = {
  south: 5.0,
  north: 23.0,
  west: 60.0,
  east: 97.0,
};

// Fix Leaflet default icon missing in Vite builds
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
  onPointClick,
  onHover,
  instruments,
  onSelectInstrument,
  selectedInstrumentId,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);      // L.imageOverlay for CMEMS data
  const markersRef = useRef([]);        // Leaflet CircleMarkers for floats
  const tooltipRef = useRef(null);
  const stateRef = useRef({});

  // ── Initialize Leaflet map once ──────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    // Create map centered on Indian Ocean domain
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

    // Place zoom control in top-right to avoid overlap with hover coordinates in top-left
    L.control.zoom({ position: "topright" }).addTo(map);

    // ── Base tile layer: Esri World Dark Gray Base (Free, crisp, no watermark) ──
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
        maxZoom: 16,
        minZoom: 4,
        opacity: 1.0,
      }
    ).addTo(map);

    // ── Reference labels overlay on top of data layer ─────────────────────
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "",
        maxZoom: 16,
        minZoom: 4,
        zIndex: 400, // render above the CMEMS canvas layer (zIndex 300)
        opacity: 0.95,
      }
    ).addTo(map);

    // ── Domain boundary rectangle ─────────────────────────────────────────
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

    // ── Domain corner labels ──────────────────────────────────────────────
    const labelStyle = {
      className: "",
      permanent: true,
      direction: "center",
    };
    [
      { pos: [DOMAIN.north, (DOMAIN.west + DOMAIN.east) / 2], text: "CMEMS Domain: Bay of Bengal + Arabian Sea" },
    ].forEach(({ pos, text }) => {
      L.marker(pos, { opacity: 0 })
        .addTo(map)
        .bindTooltip(text, { permanent: true, className: "domain-label", direction: "center" });
    });

    // ── Floating tooltip for hover ────────────────────────────────────────
    const tooltip = L.tooltip({
      permanent: false,
      className: "ocean-tooltip",
      direction: "top",
      offset: [0, -8],
    });
    tooltipRef.current = tooltip;

    // ── Map click handler → CMEMS time-series ────────────────────────────
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      // Don't fire if click was on a marker
      if (e.originalEvent.target.closest("[data-inst]")) return;
      if (onPointClick) onPointClick(lat, lng);
    });

    // ── Mouse move → hover value ──────────────────────────────────────────
    map.on("mousemove", (e) => {
      const { lat, lng } = e.latlng;
      const { surfaceData, lo, hi, pal, cs } = stateRef.current;
      if (!surfaceData) return;

      const { lat: lats, lon: lons, values } = surfaceData;
      // Find nearest grid cell
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render CMEMS data as canvas → PNG → ImageOverlay ─────────────────────
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

    // Save to stateRef for hover
    stateRef.current = { surfaceData: surface, lo, hi, pal, cs };

    // Create an offscreen canvas and paint the CMEMS data
    const canvas = document.createElement("canvas");
    canvas.width = nLon;
    canvas.height = nLat;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(nLon, nLat);
    const data = imageData.data;

    for (let latI = 0; latI < nLat; latI++) {
      // Flip vertically: lat[0] = south, canvas row 0 = top (north)
      const row = nLat - 1 - latI;
      for (let lonJ = 0; lonJ < nLon; lonJ++) {
        const val = values[latI]?.[lonJ];
        const idx = (row * nLon + lonJ) * 4;
        if (val === null || val === undefined) {
          // Fully transparent for land/missing
          data[idx] = data[idx + 1] = data[idx + 2] = 0;
          data[idx + 3] = 0;
        } else {
          const [r, g, b] = colorForValue(val, lo, hi, pal, cs);
          data[idx]     = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 200; // ~78% opacity so tile layer shows through
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Convert to PNG data URL
    const dataUrl = canvas.toDataURL("image/png");

    // Geographic bounds of the CMEMS grid (from actual lat/lon arrays)
    const bounds = L.latLngBounds(
      [lat[0], lon[0]],         // south-west
      [lat[nLat - 1], lon[nLon - 1]] // north-east
    );

    // Remove old overlay and add new one
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }
    const overlay = L.imageOverlay(dataUrl, bounds, {
      opacity: 0.78,
      interactive: false,
      zIndex: 300,
    });
    overlay.addTo(map);
    overlayRef.current = overlay;

  }, [surface, palette, colorMin, colorMax, colorScale]);

  // ── Render Argo float markers ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (!instruments?.length) return;

    instruments.forEach((inst) => {
      const isSelected = inst.instrument_id === selectedInstrumentId;
      const hasBGC = inst.bgc_params?.length > 0;

      // Color: amber for regular Argo, bright green for BGC Argo
      const fillColor = hasBGC ? "#55efc4" : "#fdcb6e";
      const borderColor = isSelected ? "#ffffff" : "rgba(255,255,255,0.5)";

      const marker = L.circleMarker([inst.latitude, inst.longitude], {
        radius: isSelected ? 9 : hasBGC ? 7 : 6,
        fillColor,
        color: borderColor,
        weight: isSelected ? 2.5 : 1.2,
        opacity: 1,
        fillOpacity: isSelected ? 1 : 0.85,
      });

      // Popup with float info
      const paramBadges = (inst.bgc_params || [])
        .map((p) => {
          const c = ARGO_PARAM_COLORS[p] || "#fff";
          return `<span style="background:${c}22;border:1px solid ${c}44;color:${c};padding:1px 5px;border-radius:4px;font-size:9px;font-weight:700;margin:1px;">${p.replace("_IN_SITU_TOTAL", "")}</span>`;
        })
        .join(" ");

      marker.bindPopup(
        `<div style="font-family:'Inter',sans-serif;font-size:11px;min-width:180px;">
          <div style="font-weight:800;font-size:13px;color:#fdcb6e;margin-bottom:5px;">
            🔴 Float ${inst.platform_number}
          </div>
          <div style="color:#9ec4db;margin-bottom:3px;">
            📍 ${inst.latitude?.toFixed(3)}°N, ${inst.longitude?.toFixed(3)}°E
          </div>
          <div style="color:#9ec4db;margin-bottom:6px;">
            📅 ${inst.timestamp?.slice(0, 10) || "—"}
          </div>
          ${paramBadges ? `<div style="margin-top:4px;">${paramBadges}</div>` : ""}
          <div style="margin-top:8px;">
            <button onclick="window._argoSelect('${inst.instrument_id}')"
              style="background:linear-gradient(135deg,#0097a7,#00d4f0);color:#030d16;border:none;padding:5px 10px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;width:100%;">
              View Depth Profile →
            </button>
          </div>
        </div>`,
        {
          className: "argo-popup",
          maxWidth: 220,
        }
      );

      // Click handler via global bridge (Leaflet popup innerHTML can't directly call React)
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectInstrument) onSelectInstrument(inst.instrument_id);
      });

      marker.addTo(map);

      // Selected marker: add pulsing ring
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

    // Global bridge for popup button clicks
    window._argoSelect = (id) => {
      if (onSelectInstrument) onSelectInstrument(id);
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruments, selectedInstrumentId]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Leaflet map container */}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%", background: "#030d16" }}
      />

      {/* Custom CSS injected for Leaflet overrides */}
      <style>{`
        /* Dark theme for Leaflet controls */
        .leaflet-control-zoom a {
          background: rgba(9,22,36,0.92) !important;
          color: #00d4f0 !important;
          border-color: rgba(30,80,130,0.4) !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-control-zoom a:hover {
          background: rgba(0,153,187,0.3) !important;
          color: #fff !important;
        }
        .leaflet-control-attribution {
          background: rgba(3,13,22,0.75) !important;
          color: rgba(77,122,154,0.8) !important;
          font-size: 8px !important;
          backdrop-filter: blur(6px);
        }
        .leaflet-control-attribution a { color: rgba(0,212,240,0.7) !important; }

        /* Argo float popup */
        .argo-popup .leaflet-popup-content-wrapper {
          background: rgba(9,22,36,0.96) !important;
          border: 1px solid rgba(40,100,160,0.5) !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          backdrop-filter: blur(12px);
        }
        .argo-popup .leaflet-popup-tip {
          background: rgba(9,22,36,0.96) !important;
        }
        .argo-popup .leaflet-popup-close-button {
          color: rgba(77,122,154,0.8) !important;
        }

        /* Domain label */
        .domain-label {
          background: rgba(3,13,22,0.7) !important;
          border: 1px solid rgba(0,212,240,0.25) !important;
          color: rgba(0,212,240,0.6) !important;
          font-size: 10px !important;
          font-family: 'Inter', sans-serif !important;
          border-radius: 4px !important;
          padding: 2px 8px !important;
          white-space: nowrap;
          backdrop-filter: blur(6px);
        }

        /* Ocean tooltip */
        .ocean-tooltip {
          background: rgba(9,22,36,0.9) !important;
          border: 1px solid rgba(40,100,160,0.5) !important;
          color: #9ec4db !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 10px !important;
          border-radius: 6px !important;
        }

        /* Pulse ring animation */
        .argo-pulse-ring {
          animation: argo-pulse 2s ease-in-out infinite;
        }
        @keyframes argo-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.1; }
        }

        /* Leaflet tiles styled for dark ocean theme */
        .leaflet-tile-pane {
          filter: brightness(0.9) contrast(1.1) saturate(0.85);
        }
      `}</style>
    </div>
  );
}
