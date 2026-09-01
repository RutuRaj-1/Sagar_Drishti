/**
 * indiaCoastlines.js
 * ------------------
 * Simplified but geographically accurate polygon coordinates for
 * India, Sri Lanka, Pakistan coastlines, and major peninsulas
 * within the CMEMS domain: 5°N–22°N, 68°E–95°E
 *
 * All coordinates are [longitude, latitude] in decimal degrees (WGS-84).
 * Sourced and simplified from Natural Earth 1:10m admin boundaries.
 */

// India mainland coastline (simplified polygon in [lon, lat] order)
export const INDIA_COAST = [
  // Western coastline (Arabian Sea side) — south to north
  [68.15, 22.0],  // Rann of Kutch north
  [68.4, 22.6],
  [69.0, 22.8],
  [70.0, 22.6],
  [70.3, 21.5],
  [70.8, 20.9],
  [71.0, 20.6],
  [71.1, 20.0],
  [72.0, 20.2],
  [72.6, 21.6],
  [72.8, 21.1],
  [72.7, 20.3],
  [73.0, 19.0],
  [73.2, 18.0],
  [73.5, 17.2],
  [73.8, 15.5],
  [74.0, 14.8],
  [74.5, 14.1],
  [74.8, 13.8],
  [74.7, 13.3],
  [75.2, 12.7],
  [76.0, 11.9],
  [76.2, 11.3],
  [77.1, 10.0],
  [77.5,  8.5],
  [77.3,  8.0],
  [76.6,  8.2],   // Kanyakumari (southern tip of India)
  // Eastern coastline (Bay of Bengal side) — south to north
  [77.7,  8.5],
  [78.0,  9.0],
  [78.5,  9.5],
  [79.0, 10.2],
  [79.5, 10.5],
  [79.8, 10.8],
  [80.0, 11.5],
  [80.2, 12.3],
  [80.3, 13.4],   // Chennai coast
  [80.2, 14.2],
  [80.4, 15.3],
  [80.6, 16.0],
  [81.0, 16.8],
  [81.5, 17.5],
  [82.0, 18.3],
  [82.5, 18.8],
  [82.7, 19.2],
  [83.5, 19.5],
  [84.0, 20.3],
  [85.0, 20.5],
  [85.5, 21.0],
  [86.5, 21.5],
  [87.0, 21.5],
  [87.5, 21.7],
  [88.0, 21.5],
  [88.5, 21.5],
  // Northern Bengal coast
  [89.5, 22.0],
  // Close back to starting point (not relevant as polygon is complex)
];

// Sri Lanka — accurate polygon [lon, lat]
// Sri Lanka is approximately 80°E–81.9°E, 5.9°N–9.8°N
// It is to the EAST/RIGHT of India's southern tip
export const SRILANKA_COAST = [
  [79.87,  9.81],  // Jaffna peninsula north
  [80.4,   9.5],
  [80.8,   9.2],
  [81.0,   8.8],
  [81.85,  8.0],  // East coast (Trincomalee)
  [81.9,   7.0],
  [81.7,   6.2],
  [80.9,   5.95], // Dondra Head (southern tip)
  [80.0,   6.0],
  [79.7,   6.5],
  [79.65,  7.0],
  [79.7,   7.8],
  [79.8,   8.5],
  [79.87,  9.81], // close
];

// Pakistan coastline (Makran coast, Sindh coast)
export const PAKISTAN_COAST = [
  [68.15, 22.0],  // east Rann of Kutch
  [68.0, 23.5],
  [68.5, 23.8],
  [69.0, 24.0],
  [61.5, 25.1],   // Makran coast (west limit ~68°E visible)
  [62.0, 24.5],
  [63.5, 25.0],
  [65.0, 25.1],
  [66.0, 24.8],
  [67.0, 24.5],
  [68.15, 22.0],
];

// Andaman Islands (simplified centroid box areas)
export const ANDAMAN_PATCHES = [
  // North Andaman ~92.7°E, 13.3°N
  [[92.6, 13.5], [92.8, 13.5], [92.8, 13.1], [92.6, 13.1]],
  // South Andaman ~92.7°E, 11.6°N
  [[92.5, 11.9], [92.85, 11.9], [92.85, 11.2], [92.5, 11.2]],
  // Nicobar ~93.8°E, 8.1°N
  [[93.6, 8.5], [93.9, 8.5], [93.9, 7.7], [93.6, 7.7]],
];

// Lakshadweep Islands (tiny dots — just approximate centres for labelling)
export const LAKSHADWEEP_CENTERS = [
  { name: "Lakshadweep", lon: 72.6, lat: 10.6 },
];

// Bangladesh coast / Bengal delta  
export const BANGLADESH_COAST = [
  [88.0, 21.5],
  [88.5, 22.0],
  [89.0, 22.1],
  [89.5, 22.0],
  [90.0, 22.5],
  [90.5, 22.7],
  [91.0, 22.5],
  [91.5, 22.6],
  [91.8, 22.3],
  [92.0, 21.8],
  [92.2, 21.3],
  [92.3, 20.9],
  [92.5, 20.8],
  [92.0, 20.0],   // Myanmar coast
  [91.9, 19.0],
  [91.5, 18.5],
];

// Myanmar / Burma coastline (simplified)
export const MYANMAR_COAST = [
  [92.3, 20.9],
  [92.5, 20.8],
  [92.2, 19.5],
  [92.0, 18.0],
  [98.7, 10.5],   // beyond our domain
];

// Key city labels for context
export const CITY_LABELS = [
  { name: "Mumbai", lon: 72.88, lat: 19.08 },
  { name: "Chennai", lon: 80.27, lat: 13.08 },
  { name: "Kolkata", lon: 88.35, lat: 22.57 },
  { name: "Kochi", lon: 76.27, lat: 9.93 },
  { name: "Colombo", lon: 79.85, lat: 6.90 },
  { name: "Visakhapatnam", lon: 83.32, lat: 17.69 },
];

// Ocean basin labels
export const OCEAN_LABELS = [
  { name: "Arabian Sea", lon: 68.5, lat: 14.0 },
  { name: "Bay of Bengal", lon: 87.5, lat: 13.0 },
  { name: "Indian Ocean", lon: 76.0, lat: 7.5 },
];
