<template>
  <div ref="sceneEl" class="cc-twin-scene" aria-label="重点区域 3D 数字孪生"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  CityId,
  DispatchBuilding,
  OsmBuildingSource,
  RiskLevel,
} from '../../types/commandCenter';

const props = defineProps<{
  cityId: CityId;
  center: [number, number];
  osmBuildingSource: OsmBuildingSource;
  buildings: DispatchBuilding[];
  selectedBuildingId: string;
}>();

const emit = defineEmits<{
  selectBuilding: [id: string];
}>();

interface OSMGeometryPoint {
  lat: number;
  lon: number;
}

interface OSMElement {
  id: number;
  tags?: Record<string, string>;
  geometry?: OSMGeometryPoint[];
}

interface OSMResponse {
  elements?: OSMElement[];
}

interface ContextBuilding {
  id: string;
  footprint: Array<[number, number]>;
  heightMeters: number;
}

const sceneEl = ref<HTMLDivElement | null>(null);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let resizeObserver: ResizeObserver | null = null;
let landmarkGroup: THREE.Group | null = null;
let osmGroup: THREE.Group | null = null;
let frameId = 0;
let beacon: THREE.Mesh | null = null;
let routeLine: THREE.Line | null = null;
let fallbackCanvas: HTMLCanvasElement | null = null;
let fallbackContext: CanvasRenderingContext2D | null = null;
let osmRequestId = 0;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const buildingMeshes = new Map<
  string,
  THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
>();
const fallbackHitBoxes = new Map<string, DOMRect>();

const sceneMeterScale = 0.004;
const heightScale = 0.006;

const riskColorMap: Record<RiskLevel, number> = {
  critical: 0xef4444,
  warning: 0xf59e0b,
  normal: 0x22c55e,
};

function getMetersPerDegreeLon() {
  return 111_320 * Math.cos((props.center[1] * Math.PI) / 180);
}

function projectCoordinate([lon, lat]: [number, number]) {
  return {
    x: (lon - props.center[0]) * getMetersPerDegreeLon() * sceneMeterScale,
    z: -(lat - props.center[1]) * 111_320 * sceneMeterScale,
  };
}

function getBuildingHeight(building: Pick<DispatchBuilding, 'height' | 'heightMeters'>) {
  return Math.max(0.22, Math.min(4.3, building.height ?? building.heightMeters * heightScale));
}

function getBuildingColor(building: DispatchBuilding) {
  if (building.id === props.selectedBuildingId) return 0x38bdf8;
  return riskColorMap[building.status];
}

function createFootprintGeometry(footprint: Array<[number, number]>, height: number) {
  const uniqueFootprint = footprint.filter((point, index) => {
    const next = footprint[index + 1];
    return !next || point[0] !== next[0] || point[1] !== next[1];
  });
  const projected = uniqueFootprint.map(projectCoordinate);
  const center = projected.reduce((acc, point) => ({ x: acc.x + point.x, z: acc.z + point.z }), {
    x: 0,
    z: 0,
  });
  center.x /= Math.max(projected.length, 1);
  center.z /= Math.max(projected.length, 1);

  const shape = new THREE.Shape();
  projected.forEach((point, index) => {
    const x = point.x - center.x;
    const y = -(point.z - center.z);
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();

  return {
    geometry,
    position: new THREE.Vector3(center.x, 0, center.z),
  };
}

function getBuildingScenePosition(building: DispatchBuilding) {
  const point = building.coordinate ? projectCoordinate(building.coordinate) : { x: 0, z: 0 };
  return new THREE.Vector3(point.x, 0, point.z);
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }

  material.dispose();
}

function clearGroup(group: THREE.Group | null) {
  if (!group) return;

  group.traverse((object) => {
    const mesh = object as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
    mesh.geometry?.dispose();
    if (mesh.material) disposeMaterial(mesh.material);
  });
  group.clear();
}

function createLandmarkBuilding(building: DispatchBuilding) {
  if (!landmarkGroup) return;

  const height = getBuildingHeight(building);
  const footprintResult = building.footprint?.length
    ? createFootprintGeometry(building.footprint, height)
    : null;
  const geometry =
    footprintResult?.geometry ??
    new THREE.BoxGeometry(building.size?.[0] ?? 0.9, height, building.size?.[1] ?? 0.9);
  const material = new THREE.MeshStandardMaterial({
    color: getBuildingColor(building),
    roughness: 0.48,
    metalness: 0.18,
    emissive: building.status === 'critical' ? 0x4a0f0f : 0x000000,
    emissiveIntensity: building.status === 'critical' ? 0.42 : 0.12,
  });
  const mesh = new THREE.Mesh(geometry, material);

  if (footprintResult) {
    mesh.position.copy(footprintResult.position);
  } else {
    const position = getBuildingScenePosition(building);
    mesh.position.set(position.x, height / 2, position.z);
  }

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.buildingId = building.id;

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }),
  );
  edge.position.copy(mesh.position);

  landmarkGroup.add(mesh);
  landmarkGroup.add(edge);
  buildingMeshes.set(building.id, mesh);
}

function createContextBuilding(building: ContextBuilding) {
  if (!osmGroup || building.footprint.length < 3) return;

  const height = Math.max(0.12, Math.min(1.8, building.heightMeters * heightScale));
  const { geometry, position } = createFootprintGeometry(building.footprint, height);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.72,
      metalness: 0.08,
      transparent: true,
      opacity: 0.58,
    }),
  );
  mesh.position.copy(position);
  mesh.receiveShadow = true;
  osmGroup.add(mesh);
}

function updateRouteLine() {
  const command = props.buildings.find((item) => item.type === 'command');
  const selected = props.buildings.find((item) => item.id === props.selectedBuildingId);
  if (!scene || !command || !selected) return;

  if (routeLine) {
    scene.remove(routeLine);
    routeLine.geometry.dispose();
    disposeMaterial(routeLine.material);
  }

  const start = getBuildingScenePosition(command);
  const end = getBuildingScenePosition(selected);
  const points = [new THREE.Vector3(start.x, 0.08, start.z), new THREE.Vector3(end.x, 0.08, end.z)];
  routeLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.5, gapSize: 0.24 }),
  );
  routeLine.computeLineDistances();
  scene.add(routeLine);
}

function updateBeacon() {
  const selected = props.buildings.find((item) => item.id === props.selectedBuildingId);
  if (!scene || !selected || !beacon) return;

  const position = getBuildingScenePosition(selected);
  beacon.position.set(position.x, getBuildingHeight(selected) + 0.55, position.z);
  const material = beacon.material as THREE.MeshBasicMaterial;
  material.color.setHex(riskColorMap[selected.status]);
}

function updateBuildingMaterials() {
  if (!renderer) {
    drawFallbackScene();
    return;
  }

  props.buildings.forEach((building) => {
    const mesh = buildingMeshes.get(building.id);
    if (!mesh) return;

    const selected = building.id === props.selectedBuildingId;
    mesh.material.color.setHex(getBuildingColor(building));
    mesh.material.emissive.setHex(
      selected ? 0x0f2740 : building.status === 'critical' ? 0x4a0f0f : 0x000000,
    );
    mesh.material.emissiveIntensity = selected
      ? 0.55
      : building.status === 'critical'
        ? 0.42
        : 0.12;
  });

  updateBeacon();
  updateRouteLine();
}

function rebuildLandmarks() {
  if (!renderer || !scene) {
    drawFallbackScene();
    return;
  }

  if (landmarkGroup) {
    scene.remove(landmarkGroup);
    clearGroup(landmarkGroup);
  }

  buildingMeshes.clear();
  landmarkGroup = new THREE.Group();
  scene.add(landmarkGroup);
  props.buildings.forEach(createLandmarkBuilding);
  updateBuildingMaterials();
  loadOsmBuildings();
}

function parseHeightMeters(element: OSMElement) {
  const height = element.tags?.height?.replace(',', '.').match(/\d+(\.\d+)?/)?.[0];
  if (height) return Number(height);

  const levels = Number(element.tags?.['building:levels']);
  if (Number.isFinite(levels) && levels > 0) return levels * 3.2;

  return 18 + (element.id % 9) * 4;
}

async function fetchOsmBuildings(source: OsmBuildingSource) {
  const [south, west, north, east] = source.bbox;
  const query = `[out:json][timeout:8];way["building"](${south},${west},${north},${east});out tags geom 90;`;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 9_000);

  try {
    const response = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      { signal: controller.signal },
    );
    if (!response.ok) throw new Error(`Overpass ${response.status}`);

    const data = (await response.json()) as OSMResponse;
    return (data.elements ?? [])
      .filter((element) => (element.geometry?.length ?? 0) >= 3)
      .slice(0, 90)
      .map<ContextBuilding>((element) => ({
        id: `osm-${element.id}`,
        footprint: element.geometry!.map((point) => [point.lon, point.lat]),
        heightMeters: parseHeightMeters(element),
      }));
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadOsmBuildings() {
  if (!renderer || !scene) return;

  const requestId = ++osmRequestId;
  if (osmGroup) {
    scene.remove(osmGroup);
    clearGroup(osmGroup);
  }

  osmGroup = new THREE.Group();
  scene.add(osmGroup);

  try {
    const buildings = await fetchOsmBuildings(props.osmBuildingSource);
    if (requestId !== osmRequestId) return;
    buildings.forEach(createContextBuilding);
  } catch {
    if (requestId !== osmRequestId || !osmGroup) return;
    props.buildings.forEach((building) => {
      if (!building.footprint) return;
      createContextBuilding({
        id: `fallback-${building.id}`,
        footprint: building.footprint,
        heightMeters: building.heightMeters,
      });
    });
  }
}

function resizeRenderer() {
  if (!sceneEl.value) return;

  if (!renderer || !camera) {
    resizeFallbackCanvas();
    drawFallbackScene();
    return;
  }

  const { clientWidth, clientHeight } = sceneEl.value;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / Math.max(clientHeight, 1);
  camera.updateProjectionMatrix();
}

function handlePointerDown(event: PointerEvent) {
  if (!sceneEl.value) return;

  if (!renderer || !camera) {
    const rect = sceneEl.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = Array.from(fallbackHitBoxes.entries()).find(([, box]) => {
      return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    });
    if (hit) emit('selectBuilding', hit[0]);
    return;
  }

  const rect = sceneEl.value.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(Array.from(buildingMeshes.values()));
  const buildingId = hits[0]?.object.userData.buildingId as string | undefined;
  if (buildingId) emit('selectBuilding', buildingId);
}

function animate() {
  frameId = requestAnimationFrame(animate);
  controls?.update();

  if (beacon) {
    beacon.rotation.y += 0.018;
    const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.12;
    beacon.scale.set(pulse, pulse, pulse);
  }

  if (scene && camera) renderer?.render(scene, camera);
}

function createFallbackRenderer(container: HTMLDivElement) {
  fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.className = 'cc-twin-fallback-canvas';
  fallbackContext = fallbackCanvas.getContext('2d');
  container.appendChild(fallbackCanvas);
  resizeFallbackCanvas();
  drawFallbackScene();
}

function resizeFallbackCanvas() {
  if (!sceneEl.value || !fallbackCanvas || !fallbackContext) return;

  const dpr = Math.min(window.devicePixelRatio, 2);
  const { clientWidth, clientHeight } = sceneEl.value;
  fallbackCanvas.width = Math.max(1, Math.floor(clientWidth * dpr));
  fallbackCanvas.height = Math.max(1, Math.floor(clientHeight * dpr));
  fallbackCanvas.style.width = `${clientWidth}px`;
  fallbackCanvas.style.height = `${clientHeight}px`;
  fallbackContext.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawFallbackScene() {
  if (!sceneEl.value || !fallbackCanvas || !fallbackContext) return;

  const ctx = fallbackContext;
  const width = sceneEl.value.clientWidth;
  const height = sceneEl.value.clientHeight;
  const scale = Math.max(26, Math.min(width / 16, height / 10));

  fallbackHitBoxes.clear();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#10100f';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const toScreen = (building: DispatchBuilding) => {
    const position = getBuildingScenePosition(building);
    return {
      x: width / 2 + position.x * scale * 0.12,
      y: height * 0.58 + position.z * scale * 0.08,
    };
  };

  const command = props.buildings.find((item) => item.type === 'command');
  const selected = props.buildings.find((item) => item.id === props.selectedBuildingId);
  if (command && selected) {
    const start = toScreen(command);
    const end = toScreen(selected);
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  props.buildings
    .slice()
    .sort((a, b) => getBuildingScenePosition(a).z - getBuildingScenePosition(b).z)
    .forEach((building) => {
      const selectedBuilding = building.id === props.selectedBuildingId;
      const point = toScreen(building);
      const blockWidth = Math.max(28, (building.size?.[0] ?? 1.1) * scale * 0.9);
      const blockDepth = Math.max(16, (building.size?.[1] ?? 0.8) * scale * 0.52);
      const blockHeight = getBuildingHeight(building) * scale * 0.34;
      const color = selectedBuilding
        ? '#38bdf8'
        : `#${riskColorMap[building.status].toString(16).padStart(6, '0')}`;
      const x = point.x - blockWidth / 2;
      const y = point.y - blockDepth / 2;

      fallbackHitBoxes.set(
        building.id,
        new DOMRect(x - 6, y - blockHeight - 6, blockWidth + 12, blockDepth + blockHeight + 12),
      );

      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.fillRect(x + 7, y + 8, blockWidth, blockDepth);

      ctx.fillStyle = color;
      ctx.globalAlpha = selectedBuilding ? 0.92 : 0.72;
      ctx.fillRect(x, y - blockHeight, blockWidth, blockHeight);
      ctx.globalAlpha = 0.52;
      ctx.fillRect(x, y, blockWidth, blockDepth);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = selectedBuilding ? '#e0f2fe' : 'rgba(255,255,255,0.34)';
      ctx.lineWidth = selectedBuilding ? 2 : 1;
      ctx.strokeRect(x, y - blockHeight, blockWidth, blockHeight + blockDepth);

      if (selectedBuilding) {
        ctx.beginPath();
        ctx.arc(point.x, y - blockHeight - 12, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });
}

function canCreateWebGLContext() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return Boolean(gl);
}

onMounted(() => {
  if (!sceneEl.value) return;

  if (!canCreateWebGLContext()) {
    createFallbackRenderer(sceneEl.value);
    resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(sceneEl.value);
    sceneEl.value.addEventListener('pointerdown', handlePointerDown);
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10100f);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(7, 7, 9);

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch {
    createFallbackRenderer(sceneEl.value);
    resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(sceneEl.value);
    sceneEl.value.addEventListener('pointerdown', handlePointerDown);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  sceneEl.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.4, -0.5);
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.minDistance = 6;
  controls.maxDistance = 18;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(3, 8, 5);
  keyLight.castShadow = true;
  scene.add(ambientLight, keyLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 11),
    new THREE.MeshStandardMaterial({ color: 0x1b1b18, roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(14, 14, 0x52525b, 0x303030);
  scene.add(grid);

  beacon = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.04, 12, 48),
    new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  );
  beacon.rotation.x = Math.PI / 2;
  scene.add(beacon);

  rebuildLandmarks();
  resizeRenderer();

  resizeObserver = new ResizeObserver(resizeRenderer);
  resizeObserver.observe(sceneEl.value);
  sceneEl.value.addEventListener('pointerdown', handlePointerDown);
  animate();
});

watch(() => props.selectedBuildingId, updateBuildingMaterials);
watch(
  () => [props.cityId, props.center, props.osmBuildingSource, props.buildings],
  rebuildLandmarks,
  { deep: true },
);

onBeforeUnmount(() => {
  osmRequestId += 1;
  cancelAnimationFrame(frameId);
  sceneEl.value?.removeEventListener('pointerdown', handlePointerDown);
  resizeObserver?.disconnect();
  controls?.dispose();
  renderer?.dispose();
  clearGroup(landmarkGroup);
  clearGroup(osmGroup);
  buildingMeshes.clear();
  if (routeLine) {
    routeLine.geometry.dispose();
    disposeMaterial(routeLine.material);
  }
  if (renderer?.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement);
  }
  renderer = null;
  fallbackCanvas?.remove();
  fallbackCanvas = null;
  fallbackContext = null;
  fallbackHitBoxes.clear();
  scene = null;
  camera = null;
  controls = null;
});
</script>
