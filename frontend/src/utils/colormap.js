// colormap.js — SAGAR-DRISHTI
// Implements SRS §3.6.4: Colorbar Mapping Logic + Variable Color Semantic System
// All palettes are calibrated to real ocean variable ranges from the
// Copernicus Marine dataset. Colors match the CSS design tokens in styles.css.

/**
 * Color semantic registry — maps CMEMS variable name → display colors.
 * These match the CSS --c-* tokens in styles.css.
 */
export const VARIABLE_COLORS = {
  tob:    { color: "#ff6b6b", dark: "#c0392b", bg: "rgba(255,107,107,0.10)", gradient: "linear-gradient(135deg,#c0392b,#ff6b6b)" },
  sob:    { color: "#4ecdc4", dark: "#0097a7", bg: "rgba(78,205,196,0.10)",  gradient: "linear-gradient(135deg,#0097a7,#4ecdc4)" },
  zos:    { color: "#74b9ff", dark: "#0984e3", bg: "rgba(116,185,255,0.10)", gradient: "linear-gradient(135deg,#0984e3,#74b9ff)" },
  mlotst: { color: "#a29bfe", dark: "#6c5ce7", bg: "rgba(162,155,254,0.10)", gradient: "linear-gradient(135deg,#6c5ce7,#a29bfe)" },
  pbo:    { color: "#fd79a8", dark: "#e84393", bg: "rgba(253,121,168,0.10)", gradient: "linear-gradient(135deg,#e84393,#fd79a8)" },
  sivelo: { color: "#dfe6e9", dark: "#b2bec3", bg: "rgba(223,230,233,0.07)", gradient: "linear-gradient(135deg,#b2bec3,#dfe6e9)" },
};

/**
 * Argo BGC parameter colors — matching CSS tokens.
 */
export const ARGO_PARAM_COLORS = {
  TEMP:             "#ff6b6b",
  PSAL:             "#4ecdc4",
  DOXY:             "#55efc4",
  CHLA:             "#fdcb6e",
  NITRATE:          "#a29bfe",
  PH_IN_SITU_TOTAL: "#fd79a8",
  BBP700:           "#e17055",
  PRES:             "#74b9ff",
};

/** Get the color hex for a CMEMS variable */
export function varColor(varName) {
  return VARIABLE_COLORS[varName]?.color || "#00d4f0";
}
/** Get the CSS variable-color-bg for a CMEMS variable */
export function varColorBg(varName) {
  return VARIABLE_COLORS[varName]?.bg || "rgba(0,212,240,0.10)";
}
/** Get the gradient string for a CMEMS variable */
export function varGradient(varName) {
  return VARIABLE_COLORS[varName]?.gradient || "linear-gradient(135deg,#0099bb,#00d4f0)";
}


export const PALETTES = {
  // ── Thermal — temperature (deep blue→teal→yellow→red) ────────────────────
  thermal: [
    [5, 10, 80],   [8, 29, 88],   [37, 52, 148],  [34, 94, 168],
    [29, 145, 192],[65, 182, 196],[127, 205, 187], [199, 233, 180],
    [237, 248, 177],[255, 237, 160],[254, 178, 76], [253, 141, 60],
    [252, 78, 42],  [227, 26, 28], [177, 0, 38],   [128, 0, 38],
  ],

  // ── Haline — salinity (purple→blue→cyan→green→yellow) ───────────────────
  haline: [
    [42, 9, 120],  [59, 45, 148], [58, 86, 173],  [35, 127, 189],
    [17, 162, 186],[19, 184, 161],[53, 196, 131],  [103, 204, 101],
    [162, 207, 71],[210, 205, 57],[246, 199, 57],  [254, 196, 79],
    [254, 218, 116],[253, 240, 158],[253, 249, 199],
  ],

  // ── Viridis — SSH / general (purple→blue→green→yellow) ──────────────────
  viridis: [
    [68, 1, 84],   [72, 40, 120], [62, 74, 137],  [49, 104, 142],
    [38, 130, 142],[31, 158, 137],[53, 183, 121],  [109, 205, 89],
    [180, 222, 44],[253, 231, 37],
  ],

  // ── Deep — MLD / pressure (white→light blue→dark blue→black) ────────────
  deep: [
    [252, 253, 191],[186, 225, 205],[96, 188, 209],[34, 148, 188],
    [17, 100, 180],[15, 60, 145],  [10, 25, 100],  [5, 10, 55],
  ],

  // ── Ice — sea ice variables (dark ocean→white ice) ───────────────────────
  ice: [
    [4, 35, 51],   [23, 86, 118], [28, 130, 162], [78, 180, 199],
    [157, 218, 228],[222, 243, 245],[245, 252, 253],[255, 255, 255],
  ],

  // ── RdBu — anomaly (negative=blue, zero=white, positive=red) ─────────────
  rdbu: [
    [33, 102, 172],[67, 147, 195],[146, 197, 222],[209, 229, 240],
    [247, 247, 247],[253, 219, 199],[244, 165, 130],[214, 96, 77],
    [178, 24, 43],
  ],

  // ── Velocity / currents ───────────────────────────────────────────────────
  velocity: [
    [5, 48, 97],   [33, 102, 172],[67, 147, 195], [146, 197, 222],
    [247, 247, 247],[253, 219, 199],[244, 165, 130],[214, 96, 77],
    [103, 0, 31],
  ],
};

/** Default palette per variable name */
export const VARIABLE_PALETTES = {
  tob: "thermal",
  sob: "haline",
  zos: "viridis",
  mlotst: "deep",
  pbo: "deep",
  sivelo: "ice",
  usi: "velocity",
  vsi: "velocity",
};

export function paletteForVariable(varName) {
  return VARIABLE_PALETTES[varName] || "thermal";
}

/**
 * Normalize a value to [0,1] given [min, max] range and optional log scale.
 * Returns null for NaN/null/undefined values.
 */
export function normalize(value, min, max, scale = "linear") {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  let v = value, lo = min, hi = max;
  if (scale === "log") {
    const g = 1e-4;
    v = Math.log(Math.max(v, g));
    lo = Math.log(Math.max(lo, g));
    hi = Math.log(Math.max(hi, g));
  }
  if (hi === lo) return 0.5;
  return Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
}

/**
 * Map a raw value → [r, g, b] using the selected palette.
 */
export function colorForValue(value, min, max, palette = "thermal", scale = "linear") {
  const t = normalize(value, min, max, scale);
  if (t === null) return [20, 30, 45];  // dark grey-blue for missing data
  const stops = PALETTES[palette] || PALETTES.thermal;
  const scaled = t * (stops.length - 1);
  const i0 = Math.floor(scaled);
  const i1 = Math.min(stops.length - 1, i0 + 1);
  const frac = scaled - i0;
  const c0 = stops[i0], c1 = stops[i1];
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * frac),
    Math.round(c0[1] + (c1[1] - c0[1]) * frac),
    Math.round(c0[2] + (c1[2] - c0[2]) * frac),
  ];
}

/** [r,g,b] → 'rgb(r,g,b)' */
export function rgbToCss([r, g, b]) {
  return `rgb(${r},${g},${b})`;
}

/** CSS linear-gradient string for a palette (for legend bars) */
export function paletteGradientCss(palette = "thermal") {
  const stops = PALETTES[palette] || PALETTES.thermal;
  const n = stops.length - 1;
  const css = stops
    .map((c, i) => `rgb(${c[0]},${c[1]},${c[2]}) ${((i / n) * 100).toFixed(1)}%`)
    .join(", ");
  return `linear-gradient(90deg, ${css})`;
}

/** Palette keys for UI selectors */
export const PALETTE_NAMES = Object.keys(PALETTES);
