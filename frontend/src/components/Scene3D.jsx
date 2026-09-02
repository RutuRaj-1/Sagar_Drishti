import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { colorForValue, paletteForVariable, PALETTES, ARGO_PARAM_COLORS } from "../utils/colormap.js";
import { extractIsosurface } from "../utils/marchingCubes.js";

/**
 * Scene3D — 3D Ocean Perspective & Volumetric View
 * ------------------------------------------------
 * Full Tier 1 & Tier 2 WebGL Implementation:
 *  - 3D Terrain Heightfield Mesh (with vertical exaggeration and vertex colors)
 *  - 3D Marching Cubes Volumetric Isosurface (e.g. 26°C/28°C cyclone isotherm shell)
 *  - 3D Current Velocity Cones/Vectors (u, v hydrodynamic flow fields)
 *  - 3D Argo float & Glider markers with interactive raycasting
 *  - 3D Billboard Geographical Reference Labels (Arabian Sea, Bay of Bengal, etc.)
 */

function createTextSprite(text, color = "#00d4f0", bg = "rgba(4,17,29,0.85)", fontSize = 32, scaleW = 44, scaleH = 12) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = bg;
  if (ctx.roundRect) {
    ctx.roundRect(16, 16, 480, 96, 24);
  } else {
    ctx.rect(16, 16, 480, 96);
  }
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = `bold ${fontSize}px 'Outfit', 'Inter', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(scaleW, scaleH, 1);
  return sprite;
}

export default function Scene3D({
  surface,              // { lat, lon, values[][], min_value, max_value, variable }
  palette,
  colorScale,
  colorMin,
  colorMax,
  verticalExaggeration = 1.5,
  layerOpacity = 0.85,
  instruments = [],
  gliders = [],
  currentVectors = null,
  showCurrents = false,
  isosurfaceGrid = null,
  showIsosurface = false,
  isovalue = 28.0,
  onSelectInstrument,
  selectedInstrumentId,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  // ── One-time Three.js scene setup ─────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030d16);
    scene.fog = new THREE.FogExp2(0x030d16, 0.0012);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      8000
    );
    camera.position.set(0, 140, 230);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 5, 0);
    controls.minDistance = 30;
    controls.maxDistance = 750;
    controls.maxPolarAngle = Math.PI * 0.52;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x4488aa, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xaaddff, 1.4);
    dirLight.position.set(120, 240, 100);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0x00d4f0, 0.7, 600);
    pointLight.position.set(-100, 100, -80);
    scene.add(pointLight);

    // Sea floor reference plane
    const seaGeo = new THREE.PlaneGeometry(320, 220, 1, 1);
    const seaMat = new THREE.MeshBasicMaterial({
      color: 0x05182a,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const seaPlane = new THREE.Mesh(seaGeo, seaMat);
    seaPlane.rotation.x = -Math.PI / 2;
    seaPlane.position.y = -0.2;
    scene.add(seaPlane);

    const gridHelper = new THREE.GridHelper(320, 20, 0x00d4f0, 0x0a3050);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Dedicated groups
    const dataGroup = new THREE.Group();
    const isosurfaceGroup = new THREE.Group();
    const vectorGroup = new THREE.Group();
    const instrumentGroup = new THREE.Group();
    const labelGroup = new THREE.Group();
    scene.add(dataGroup, isosurfaceGroup, vectorGroup, instrumentGroup, labelGroup);

    // Static geographic reference labels
    const labels = [
      { text: "🌊 Arabian Sea", pos: [-85, 12, -15], color: "#74b9ff", scaleW: 42, scaleH: 11 },
      { text: "🌊 Bay of Bengal", pos: [85, 12, -15], color: "#4ecdc4", scaleW: 42, scaleH: 11 },
      { text: "🇮🇳 Indian Peninsula", pos: [-10, 16, -20], color: "#fdcb6e", scaleW: 46, scaleH: 11 },
      { text: "🇱🇰 Sri Lanka", pos: [22, 10, 68], color: "#55efc4", scaleW: 34, scaleH: 10 },
      { text: "🏝️ Lakshadweep", pos: [-45, 8, 38], color: "#9ec4db", scaleW: 38, scaleH: 9 },
      { text: "🏝️ Andaman & Nicobar", pos: [115, 8, 24], color: "#9ec4db", scaleW: 46, scaleH: 9 },
      { text: "🧭 North (22°N)", pos: [0, 4, -105], color: "#4d7a9a", scaleW: 36, scaleH: 8 },
      { text: "🧭 South (5°N)", pos: [0, 4, 105], color: "#4d7a9a", scaleW: 36, scaleH: 8 },
    ];

    labels.forEach(({ text, pos, color, scaleW, scaleH }) => {
      const sprite = createTextSprite(text, color, "rgba(4,17,29,0.88)", 28, scaleW, scaleH);
      sprite.position.set(pos[0], pos[1], pos[2]);
      labelGroup.add(sprite);
    });

    // Raycaster for 3D marker clicks
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onClick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(instrumentGroup.children, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj && !obj.userData.instrumentId) obj = obj.parent;
        if (obj?.userData.instrumentId) {
          stateRef.current.onSelectInstrument?.(obj.userData.instrumentId);
        }
      }
    }
    renderer.domElement.addEventListener("click", onClick);

    // Animation loop
    let frameId;
    const clock = new THREE.Clock();
    function animate() {
      frameId = requestAnimationFrame(animate);
      controls.update();
      const t = clock.getElapsedTime();
      if (seaMat) seaMat.opacity = 0.65 + 0.05 * Math.sin(t * 0.8);

      // Subtle rotation/pulse for isosurface if present
      if (isosurfaceGroup.children.length > 0) {
        isosurfaceGroup.children.forEach(mesh => {
          if (mesh.material?.opacity) {
            mesh.material.opacity = layerOpacity * (0.85 + 0.05 * Math.sin(t * 1.2));
          }
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    stateRef.current = {
      ...stateRef.current,
      scene, camera, renderer, controls,
      dataGroup, isosurfaceGroup, vectorGroup, instrumentGroup, labelGroup,
      onSelectInstrument,
    };

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Fresh callback
  useEffect(() => {
    stateRef.current.onSelectInstrument = onSelectInstrument;
  }, [onSelectInstrument]);

  // ── Rebuild 3D Terrain Mesh ───────────────────────────────────────────────
  useEffect(() => {
    const { dataGroup } = stateRef.current;
    if (!dataGroup || !surface) return;

    while (dataGroup.children.length) {
      const obj = dataGroup.children.pop();
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material?.dispose();
    }

    const { lat, lon, values, min_value, max_value } = surface;
    const nLat = lat.length, nLon = lon.length;
    if (nLat < 2 || nLon < 2) return;

    const lo = colorMin ?? min_value;
    const hi = colorMax ?? max_value;
    const pal = palette || paletteForVariable(surface.variable);
    const exag = verticalExaggeration ?? 1.5;

    const WORLD_W = 300, WORLD_D = 200;
    const TERRAIN_BASE_Y = 0;
    const TERRAIN_AMPLITUDE = 8;

    const geometry = new THREE.PlaneGeometry(WORLD_W, WORLD_D, nLon - 1, nLat - 1);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let latI = 0; latI < nLat; latI++) {
      for (let lonJ = 0; lonJ < nLon; lonJ++) {
        const vIdx = (nLat - 1 - latI) * nLon + lonJ;
        const val = values?.[latI]?.[lonJ];

        if (val !== null && val !== undefined && !isNaN(val)) {
          const norm = Math.max(0, Math.min(1, (val - lo) / (hi - lo || 1)));
          // Smooth physical relief: gentle undulation without steep walls
          const y = TERRAIN_BASE_Y + (norm - 0.5) * TERRAIN_AMPLITUDE * exag;
          positions.setY(vIdx, y);
        } else {
          // Land sits flush at sea level baseline
          positions.setY(vIdx, TERRAIN_BASE_Y);
        }

        const [r, g, b] = colorForValue(val, lo, hi, pal, colorScale || "linear");
        colors[vIdx * 3]     = r / 255;
        colors[vIdx * 3 + 1] = g / 255;
        colors[vIdx * 3 + 2] = b / 255;
      }
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 35,
      specular: new THREE.Color(0x225577),
      side: THREE.FrontSide,
      transparent: layerOpacity < 1.0,
      opacity: layerOpacity,
    });

    const mesh = new THREE.Mesh(geometry, material);
    dataGroup.add(mesh);

    const wireGeo = new THREE.WireframeGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x00d4f0,
      transparent: true,
      opacity: 0.08,
    });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    dataGroup.add(wire);

    stateRef.current.meshParams = { lo, hi, exag, TERRAIN_BASE_Y, TERRAIN_AMPLITUDE, WORLD_W, WORLD_D };
  }, [surface, palette, colorMin, colorMax, colorScale, verticalExaggeration, layerOpacity]);

  // ── Rebuild 3D Marching Cubes Isosurface ──────────────────────────────────
  useEffect(() => {
    const { isosurfaceGroup } = stateRef.current;
    if (!isosurfaceGroup) return;

    while (isosurfaceGroup.children.length) {
      const obj = isosurfaceGroup.children.pop();
      obj.geometry?.dispose();
      obj.material?.dispose();
    }

    if (!showIsosurface || !isosurfaceGrid) return;

    try {
      const isoGeo = extractIsosurface(isosurfaceGrid, isovalue, { width: 300, depth: 200, height: 60 });
      if (isoGeo) {
        // Derive isosurface color from the active variable's palette at 75% (warm-end highlight)
        const pal = palette || paletteForVariable(surface?.variable || "temperature");
        const stops = PALETTES[pal] || PALETTES.thermal;
        const idx75 = Math.min(stops.length - 1, Math.floor(stops.length * 0.75));
        const [ir, ig, ib] = stops[idx75];
        const isoHex = (ir << 16) | (ig << 8) | ib;
        const emissiveHex = ((Math.floor(ir * 0.3)) << 16) | ((Math.floor(ig * 0.3)) << 8) | Math.floor(ib * 0.3);

        const isoMat = new THREE.MeshPhongMaterial({
          color: new THREE.Color(isoHex),
          emissive: new THREE.Color(emissiveHex),
          transparent: true,
          opacity: 0.82,
          shininess: 70,
          side: THREE.DoubleSide,
        });
        const isoMesh = new THREE.Mesh(isoGeo, isoMat);
        isosurfaceGroup.add(isoMesh);

        // Subtle wireframe on isosurface
        const wire = new THREE.LineSegments(
          new THREE.WireframeGeometry(isoGeo),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })
        );
        isosurfaceGroup.add(wire);
      }
    } catch (err) {
      console.error("Isosurface extraction error:", err);
    }
  }, [showIsosurface, isosurfaceGrid, isovalue, layerOpacity, palette, surface]);

  // ── Rebuild 3D Current Velocity Vectors (Cones/Arrows) ────────────────────
  useEffect(() => {
    const { vectorGroup } = stateRef.current;
    if (!vectorGroup) return;

    while (vectorGroup.children.length) {
      const obj = vectorGroup.children.pop();
      obj.geometry?.dispose();
      obj.material?.dispose();
    }

    if (!showCurrents || !currentVectors?.points || !surface) return;

    const { lat, lon } = surface;
    const latMin = lat[0], latMax = lat[lat.length - 1];
    const lonMin = lon[0], lonMax = lon[lon.length - 1];
    const WORLD_W = 300, WORLD_D = 200;
    const maxSpeed = currentVectors.max_speed || 1.0;

    const points = currentVectors.points;
    const coneGeo = new THREE.ConeGeometry(1.2, 4.5, 8);
    coneGeo.rotateX(Math.PI / 2); // Point forward

    points.forEach((pt) => {
      const x = ((pt.lon - lonMin) / (lonMax - lonMin) - 0.5) * WORLD_W;
      const z = -((pt.lat - latMin) / (latMax - latMin) - 0.5) * WORLD_D;
      const y = 8; // Slightly elevated above ground plane

      // Use the same 'speed' palette as the 2D map arrows — full visual consistency
      const [sr, sg, sb] = colorForValue(pt.speed, 0, maxSpeed, "speed", "linear");
      const coneColor = new THREE.Color(sr / 255, sg / 255, sb / 255);

      const coneMat = new THREE.MeshBasicMaterial({ color: coneColor, transparent: true, opacity: 0.88 });
      const cone = new THREE.Mesh(coneGeo, coneMat);

      cone.position.set(x, y, z);
      // Math angle_deg (0=East (+X), 90=North (-Z))
      const rad = (pt.angle_deg * Math.PI) / 180;
      cone.rotation.y = rad;
      const spdNorm = Math.min(1.0, pt.speed / maxSpeed);
      const scale = 0.8 + spdNorm * 1.4;
      cone.scale.set(scale, scale, scale);

      vectorGroup.add(cone);
    });
  }, [showCurrents, currentVectors, surface]);

  // ── Rebuild 3D Instrument Markers (Argo & Gliders) ────────────────────────
  useEffect(() => {
    const { instrumentGroup } = stateRef.current;
    if (!instrumentGroup || !surface) return;

    while (instrumentGroup.children.length) {
      const obj = instrumentGroup.children.pop();
      obj.geometry?.dispose();
      obj.material?.dispose();
    }

    const allInsts = [
      ...instruments.map(i => ({ ...i, kind: "argo" })),
      ...gliders.map(g => ({ ...g, kind: "glider" })),
    ];

    if (!allInsts.length) return;

    const { lat, lon, values, min_value, max_value } = surface;
    const latMin = lat[0], latMax = lat[lat.length - 1];
    const lonMin = lon[0], lonMax = lon[lon.length - 1];
    const nLat = lat.length, nLon = lon.length;
    const WORLD_W = 300, WORLD_D = 200;
    const lo = colorMin ?? min_value;
    const hi = colorMax ?? max_value;
    const exag = verticalExaggeration ?? 1.5;
    const TERRAIN_BASE_Y = 0;
    const TERRAIN_AMPLITUDE = 8;

    allInsts.forEach((inst) => {
      const x = ((inst.longitude - lonMin) / (lonMax - lonMin) - 0.5) * WORLD_W;
      const z = -((inst.latitude - latMin) / (latMax - latMin) - 0.5) * WORLD_D;

      const latIdx = Math.max(0, Math.min(nLat - 1, Math.round(((inst.latitude - latMin) / (latMax - latMin)) * (nLat - 1))));
      const lonIdx = Math.max(0, Math.min(nLon - 1, Math.round(((inst.longitude - lonMin) / (lonMax - lonMin)) * (nLon - 1))));
      const val = values?.[latIdx]?.[lonIdx];
      const norm = (val !== null && val !== undefined && !isNaN(val))
        ? Math.max(0, Math.min(1, (val - lo) / (hi - lo || 1)))
        : 0.5;
      const ySurface = TERRAIN_BASE_Y + (norm - 0.5) * TERRAIN_AMPLITUDE * exag;

      const isSelected = inst.instrument_id === selectedInstrumentId;
      const isGlider = inst.kind === "glider";
      const hasBGC = inst.bgc_params?.length > 0;
      const color = isSelected ? "#ffffff" : isGlider ? "#00d4f0" : hasBGC ? "#55efc4" : "#fdcb6e";

      const group = new THREE.Group();
      group.userData.instrumentId = inst.instrument_id;

      // Spike stem
      const stemH = isSelected ? 22 : isGlider ? 18 : 15;
      const stemGeo = new THREE.CylinderGeometry(0.35, 0.1, stemH, 6);
      const stemMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(x, ySurface + stemH / 2, z);
      group.add(stem);

      // Top marker sphere / diamond for glider
      const ballR = isSelected ? 4.5 : isGlider ? 3.6 : 2.8;
      const ballGeo = isGlider
        ? new THREE.OctahedronGeometry(ballR)
        : new THREE.SphereGeometry(ballR, 16, 16);
      const ballMat = new THREE.MeshPhongMaterial({
        color,
        emissive: new THREE.Color(color).multiplyScalar(0.5),
        shininess: 90,
      });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(x, ySurface + stemH + ballR, z);
      ball.userData.instrumentId = inst.instrument_id;
      group.add(ball);

      // Glow ring for selected
      if (isSelected) {
        const ringGeo = new THREE.RingGeometry(ballR + 2, ballR + 5.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x, ySurface + stemH + ballR, z);
        ring.lookAt(x, 999, z);
        group.add(ring);
      }

      instrumentGroup.add(group);
    });
  }, [instruments, gliders, surface, selectedInstrumentId, verticalExaggeration, colorMin, colorMax]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "relative" }} />;
}
