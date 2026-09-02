/**
 * marchingCubes.js
 * -----------------
 * Browser-native Marching Cubes 3D isosurface extraction for SAGAR-DRISHTI.
 * Implements the standard Lorensen & Cline polygonisation algorithm to extract
 * constant-value surfaces (e.g. 26°C/28°C cyclone intensification isotherm,
 * halocline, or oxycline) from 3D scalar ocean data.
 *
 * Returns a THREE.BufferGeometry ready for rendering with phong/standard materials.
 */
import * as THREE from "three";

// Pre-computed edge connection lookup tables
const EDGE_TABLE = new Int32Array([
  0x0, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
  0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
  0x190, 0x99, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
  0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
  0x230, 0x339, 0x33, 0x13a, 0x636, 0x73f, 0x435, 0x53c,
  0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
  0x3a0, 0x2a9, 0x1a3, 0xaa, 0x7a6, 0x6af, 0x5a5, 0x4ac,
  0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
  0x460, 0x569, 0x663, 0x76a, 0x66, 0x16f, 0x265, 0x36c,
  0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
  0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff, 0x3f5, 0x2fc,
  0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
  0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55, 0x15c,
  0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
  0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc,
  0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xab3, 0x9c9, 0x8c0,
  0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
  0xcc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
  0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
  0x15c, 0x55, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
  0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
  0x2fc, 0x3f5, 0xff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
  0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
  0x36c, 0x265, 0x16f, 0x66, 0x76a, 0x663, 0x569, 0x460,
  0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
  0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa, 0x1a3, 0x2a9, 0x3a0,
  0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
  0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33, 0x339, 0x230,
  0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
  0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99, 0x190,
  0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
  0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0
]);

// Standard Marching Cubes triangle table
const TRI_TABLE = [
  [-1],
  [0, 8, 3, -1],
  [0, 1, 9, -1],
  [1, 8, 3, 9, 8, 1, -1],
  [1, 2, 10, -1],
  [0, 8, 3, 1, 2, 10, -1],
  [9, 2, 10, 0, 2, 9, -1],
  [2, 8, 3, 2, 10, 8, 10, 9, 8, -1],
  [3, 11, 2, -1],
  [0, 11, 2, 8, 11, 0, -1],
  [1, 9, 0, 2, 3, 11, -1],
  [1, 11, 2, 1, 9, 11, 9, 8, 11, -1],
  [3, 10, 1, 11, 10, 3, -1],
  [0, 10, 1, 0, 8, 10, 8, 11, 10, -1],
  [3, 9, 0, 3, 11, 9, 11, 10, 9, -1],
  [9, 8, 10, 10, 8, 11, -1],
  [4, 7, 8, -1],
  [4, 3, 0, 7, 3, 4, -1],
  [0, 1, 9, 8, 4, 7, -1],
  [4, 1, 9, 4, 7, 1, 7, 3, 1, -1],
  [1, 2, 10, 8, 4, 7, -1],
  [3, 4, 7, 3, 0, 4, 1, 2, 10, -1],
  [9, 2, 10, 9, 0, 2, 8, 4, 7, -1],
  [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1],
  [8, 4, 7, 3, 11, 2, -1],
  [11, 4, 7, 11, 2, 4, 2, 0, 4, -1],
  [9, 0, 1, 8, 4, 7, 2, 3, 11, -1],
  [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1],
  [3, 10, 1, 3, 11, 10, 7, 8, 4, -1],
  [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1],
  [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1],
  [4, 7, 11, 4, 11, 9, 9, 11, 10, -1],
  [9, 5, 4, -1],
  [9, 5, 4, 0, 8, 3, -1],
  [0, 5, 4, 1, 5, 0, -1],
  [8, 5, 4, 8, 3, 5, 3, 1, 5, -1],
  [1, 2, 10, 9, 5, 4, -1],
  [3, 0, 8, 1, 2, 10, 4, 9, 5, -1],
  [5, 2, 10, 5, 4, 2, 4, 0, 2, -1],
  [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1],
  [9, 5, 4, 2, 3, 11, -1],
  [0, 11, 2, 0, 8, 11, 4, 9, 5, -1],
  [0, 5, 4, 0, 1, 5, 2, 3, 11, -1],
  [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1],
  [10, 3, 11, 10, 1, 3, 9, 5, 4, -1],
  [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1],
  [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1],
  [5, 4, 8, 5, 8, 10, 10, 8, 11, -1],
  [9, 7, 8, 5, 7, 9, -1],
  [9, 3, 0, 9, 5, 3, 5, 7, 3, -1],
  [0, 7, 8, 0, 1, 7, 1, 5, 7, -1],
  [1, 5, 3, 3, 5, 7, -1],
  [9, 7, 8, 9, 5, 7, 10, 1, 2, -1],
  [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1],
  [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1],
  [2, 10, 5, 2, 5, 3, 3, 5, 7, -1],
  [7, 9, 5, 7, 8, 9, 3, 11, 2, -1],
  [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1],
  [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1],
  [11, 2, 1, 11, 1, 7, 7, 1, 5, -1],
  [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1],
  [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
  [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
  [11, 10, 5, 7, 11, 5, -1],
  [10, 6, 5, -1],
  [0, 8, 3, 5, 10, 6, -1],
  [9, 0, 1, 5, 10, 6, -1],
  [1, 8, 3, 1, 9, 8, 5, 10, 6, -1],
  [1, 6, 5, 2, 6, 1, -1],
  [1, 6, 5, 1, 2, 6, 3, 0, 8, -1],
  [9, 6, 5, 9, 0, 6, 0, 2, 6, -1],
  [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1],
  [2, 3, 11, 10, 6, 5, -1],
  [11, 0, 8, 11, 2, 0, 10, 6, 5, -1],
  [0, 1, 9, 2, 3, 11, 5, 10, 6, -1],
  [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1],
  [6, 3, 11, 6, 5, 3, 5, 1, 3, -1],
  [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1],
  [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1],
  [6, 5, 9, 6, 9, 11, 11, 9, 8, -1],
  [5, 10, 6, 4, 7, 8, -1],
  [4, 3, 0, 4, 7, 3, 6, 5, 10, -1],
  [1, 9, 0, 5, 10, 6, 8, 4, 7, -1],
  [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1],
  [6, 1, 2, 6, 5, 1, 4, 7, 8, -1],
  [1, 2, 6, 1, 6, 5, 0, 4, 3, 4, 7, 3, -1],
  [7, 8, 4, 9, 6, 5, 9, 0, 6, 0, 2, 6, -1],
  [7, 3, 2, 7, 2, 5, 7, 5, 4, 6, 5, 2, -1],
  [10, 6, 5, 8, 4, 7, 3, 11, 2, -1],
  [6, 5, 10, 7, 11, 4, 11, 2, 4, 2, 0, 4, -1],
  [9, 0, 1, 8, 4, 7, 2, 3, 11, 5, 10, 6, -1],
  [7, 11, 4, 11, 2, 4, 9, 1, 5, 6, 5, 1, -1],
  [7, 8, 4, 6, 3, 11, 6, 5, 3, 5, 1, 3, -1],
  [4, 7, 11, 4, 11, 5, 0, 4, 5, 0, 5, 1, 5, 11, 6, -1],
  [7, 8, 4, 6, 5, 9, 6, 9, 11, 11, 9, 8, -1],
  [7, 11, 6, 7, 6, 4, 4, 6, 5, -1],
  [4, 6, 9, 6, 10, 9, -1],
  [0, 8, 3, 4, 6, 9, 6, 10, 9, -1],
  [4, 6, 0, 6, 10, 0, 10, 1, 0, -1],
  [8, 3, 1, 8, 1, 4, 4, 1, 6, 6, 1, 10, -1],
  [4, 6, 9, 6, 10, 9, 2, 10, 1, -1],
  [9, 6, 4, 9, 10, 6, 0, 8, 3, 1, 2, 10, -1],
  [4, 6, 0, 6, 2, 0, 6, 10, 2, -1],
  [8, 3, 2, 8, 2, 4, 4, 2, 6, -1],
  [4, 6, 9, 6, 10, 9, 2, 3, 11, -1],
  [4, 6, 9, 6, 10, 9, 0, 11, 2, 8, 11, 0, -1],
  [0, 1, 9, 2, 3, 11, 4, 6, 9, 6, 10, 9, -1],
  [1, 9, 8, 1, 8, 11, 1, 11, 2, 4, 6, 9, 6, 10, 9, -1],
  [3, 11, 6, 3, 6, 1, 1, 6, 4, 1, 4, 9, -1],
  [0, 8, 11, 0, 11, 4, 4, 11, 6, 1, 0, 4, -1],
  [3, 11, 6, 3, 6, 0, 0, 6, 4, -1],
  [8, 11, 6, 8, 6, 4, -1],
  [9, 10, 6, 9, 6, 7, 9, 7, 8, 7, 6, 5, -1],
  [10, 6, 5, 7, 9, 0, 7, 0, 3, 7, 5, 9, -1],
  [0, 1, 6, 0, 6, 8, 8, 6, 7, 1, 10, 6, -1],
  [3, 1, 6, 3, 6, 7, 7, 6, 5, -1],
  [9, 10, 6, 9, 6, 7, 9, 7, 8, 7, 6, 5, 1, 2, 10, -1],
  [0, 3, 7, 0, 7, 9, 9, 7, 5, 1, 2, 10, -1],
  [0, 2, 6, 0, 6, 8, 8, 6, 7, 2, 10, 6, -1],
  [3, 2, 6, 3, 6, 7, 7, 6, 5, -1],
  [9, 10, 6, 9, 6, 7, 9, 7, 8, 7, 6, 5, 2, 3, 11, -1],
  [10, 6, 5, 9, 7, 2, 9, 2, 0, 2, 7, 11, 5, 7, 9, -1],
  [0, 1, 6, 0, 6, 8, 8, 6, 7, 1, 10, 6, 2, 3, 11, -1],
  [11, 2, 1, 11, 1, 6, 6, 1, 5, 6, 5, 7, -1],
  [9, 10, 6, 9, 6, 7, 9, 7, 8, 7, 6, 5, 10, 1, 3, 10, 3, 11, -1],
  [5, 7, 11, 5, 11, 10, 10, 11, 6, 1, 0, 9, -1],
  [11, 6, 7, 11, 0, 6, 0, 8, 6, 3, 0, 11, -1],
  [6, 7, 11, -1]
];

function lerp(a, b, t) {
  return a + t * (b - a);
}

function vertexInterp(iso, p1, p2, val1, val2) {
  if (Math.abs(iso - val1) < 0.00001) return p1;
  if (Math.abs(iso - val2) < 0.00001) return p2;
  if (Math.abs(val1 - val2) < 0.00001) return p1;
  const mu = (iso - val1) / (val2 - val1);
  return [
    lerp(p1[0], p2[0], mu),
    lerp(p1[1], p2[1], mu),
    lerp(p1[2], p2[2], mu),
  ];
}

/**
 * Extract 3D isosurface mesh from a scalar grid.
 *
 * @param {Object} volData - { flat_values, shape: [depth_count, lat_count, lon_count], depths, lats, lons }
 * @param {number} isovalue - Target contour value (e.g. 26.0 for 26°C isotherm)
 * @param {Object} worldDims - { width: 300, depth: 200, height: 60 }
 * @returns {THREE.BufferGeometry|null}
 */
export function extractIsosurface(volData, isovalue, worldDims = { width: 300, depth: 200, height: 60 }) {
  if (!volData || !volData.flat_values || !volData.shape) return null;

  const [nD, nLat, nLon] = volData.shape;
  const values = volData.flat_values;
  const { width: W, depth: D, height: H } = worldDims;

  const positions = [];

  // Helper to get 3D value at (z, y, x) = (depthIdx, latIdx, lonIdx)
  function getVal(d, latI, lonJ) {
    if (d < 0 || d >= nD || latI < 0 || latI >= nLat || lonJ < 0 || lonJ >= nLon) return -9999;
    const idx = (d * nLat + latI) * nLon + lonJ;
    const v = values[idx];
    return v === -9999.0 ? -9999 : v;
  }

  // Convert (d, latI, lonJ) to world coordinates (x, y, z)
  // X: West to East [-W/2, W/2]
  // Y: Depth [0 (surface) to -H (deep water)]
  // Z: North to South [-D/2 (North 22°N) to +D/2 (South 5°N)]
  function getWorldPos(d, latI, lonJ) {
    const x = (lonJ / (nLon - 1) - 0.5) * W;
    const z = -((latI / (nLat - 1)) - 0.5) * D;
    const y = 30 - (d / (nD - 1)) * H; // surface sits at Y=30, deep bottom at Y=-30
    return [x, y, z];
  }

  // Iterate each grid voxel cube
  for (let d = 0; d < nD - 1; d++) {
    for (let latI = 0; latI < nLat - 1; latI++) {
      for (let lonJ = 0; lonJ < nLon - 1; lonJ++) {
        // 8 cube corners
        const p0 = getWorldPos(d, latI, lonJ);
        const p1 = getWorldPos(d, latI, lonJ + 1);
        const p2 = getWorldPos(d, latI + 1, lonJ + 1);
        const p3 = getWorldPos(d, latI + 1, lonJ);
        const p4 = getWorldPos(d + 1, latI, lonJ);
        const p5 = getWorldPos(d + 1, latI, lonJ + 1);
        const p6 = getWorldPos(d + 1, latI + 1, lonJ + 1);
        const p7 = getWorldPos(d + 1, latI + 1, lonJ);

        const v0 = getVal(d, latI, lonJ);
        const v1 = getVal(d, latI, lonJ + 1);
        const v2 = getVal(d, latI + 1, lonJ + 1);
        const v3 = getVal(d, latI + 1, lonJ);
        const v4 = getVal(d + 1, latI, lonJ);
        const v5 = getVal(d + 1, latI, lonJ + 1);
        const v6 = getVal(d + 1, latI + 1, lonJ + 1);
        const v7 = getVal(d + 1, latI + 1, lonJ);

        // Skip if any corner has missing data
        if (v0 <= -9000 || v1 <= -9000 || v2 <= -9000 || v3 <= -9000 ||
            v4 <= -9000 || v5 <= -9000 || v6 <= -9000 || v7 <= -9000) {
          continue;
        }

        // Calculate cube index
        let cubeIndex = 0;
        if (v0 < isovalue) cubeIndex |= 1;
        if (v1 < isovalue) cubeIndex |= 2;
        if (v2 < isovalue) cubeIndex |= 4;
        if (v3 < isovalue) cubeIndex |= 8;
        if (v4 < isovalue) cubeIndex |= 16;
        if (v5 < isovalue) cubeIndex |= 32;
        if (v6 < isovalue) cubeIndex |= 64;
        if (v7 < isovalue) cubeIndex |= 128;

        if (EDGE_TABLE[cubeIndex] === 0) continue;

        // Interpolate vertices on active edges
        const vertList = new Array(12);
        if (EDGE_TABLE[cubeIndex] & 1)    vertList[0]  = vertexInterp(isovalue, p0, p1, v0, v1);
        if (EDGE_TABLE[cubeIndex] & 2)    vertList[1]  = vertexInterp(isovalue, p1, p2, v1, v2);
        if (EDGE_TABLE[cubeIndex] & 4)    vertList[2]  = vertexInterp(isovalue, p2, p3, v2, v3);
        if (EDGE_TABLE[cubeIndex] & 8)    vertList[3]  = vertexInterp(isovalue, p3, p0, v3, v0);
        if (EDGE_TABLE[cubeIndex] & 16)   vertList[4]  = vertexInterp(isovalue, p4, p5, v4, v5);
        if (EDGE_TABLE[cubeIndex] & 32)   vertList[5]  = vertexInterp(isovalue, p5, p6, v5, v6);
        if (EDGE_TABLE[cubeIndex] & 64)   vertList[6]  = vertexInterp(isovalue, p6, p7, v6, v7);
        if (EDGE_TABLE[cubeIndex] & 128)  vertList[7]  = vertexInterp(isovalue, p7, p4, v7, v4);
        if (EDGE_TABLE[cubeIndex] & 256)  vertList[8]  = vertexInterp(isovalue, p0, p4, v0, v4);
        if (EDGE_TABLE[cubeIndex] & 512)  vertList[9]  = vertexInterp(isovalue, p1, p5, v1, v5);
        if (EDGE_TABLE[cubeIndex] & 1024) vertList[10] = vertexInterp(isovalue, p2, p6, v2, v6);
        if (EDGE_TABLE[cubeIndex] & 2048) vertList[11] = vertexInterp(isovalue, p3, p7, v3, v7);

        // Generate triangles
        const triRow = TRI_TABLE[cubeIndex];
        if (!triRow) continue;
        for (let i = 0; triRow[i] !== -1; i += 3) {
          const vA = vertList[triRow[i]];
          const vB = vertList[triRow[i + 1]];
          const vC = vertList[triRow[i + 2]];
          if (vA && vB && vC) {
            positions.push(vA[0], vA[1], vA[2]);
            positions.push(vB[0], vB[1], vB[2]);
            positions.push(vC[0], vC[1], vC[2]);
          }
        }
      }
    }
  }

  if (positions.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}
