<template>
  <div ref="sceneEl" class="cc-twin-scene" aria-label="重点区域 3D 数字孪生"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { DispatchBuilding, RiskLevel } from '../../types/commandCenter';

const props = defineProps<{
  buildings: DispatchBuilding[];
  selectedBuildingId: string;
}>();

const emit = defineEmits<{
  selectBuilding: [id: string];
}>();

const sceneEl = ref<HTMLDivElement | null>(null);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let resizeObserver: ResizeObserver | null = null;
let frameId = 0;
let beacon: THREE.Mesh | null = null;
let routeLine: THREE.Line | null = null;
let fallbackCanvas: HTMLCanvasElement | null = null;
let fallbackContext: CanvasRenderingContext2D | null = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const buildingMeshes = new Map<string, THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>>();
const fallbackHitBoxes = new Map<string, DOMRect>();

const riskColorMap: Record<RiskLevel, number> = {
  critical: 0xef4444,
  warning: 0xf59e0b,
  normal: 0x22c55e,
};

function getBuildingColor(building: DispatchBuilding) {
  if (building.id === props.selectedBuildingId) return 0x38bdf8;
  return riskColorMap[building.status];
}

function createBuilding(building: DispatchBuilding) {
  const geometry = new THREE.BoxGeometry(building.size[0], building.height, building.size[1]);
  const material = new THREE.MeshStandardMaterial({
    color: getBuildingColor(building),
    roughness: 0.45,
    metalness: 0.16,
    emissive: building.status === 'critical' ? 0x4a0f0f : 0x000000,
    emissiveIntensity: building.status === 'critical' ? 0.45 : 0.12,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(building.position[0], building.height / 2, building.position[1]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.buildingId = building.id;

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }),
  );
  edge.position.copy(mesh.position);

  scene?.add(mesh);
  scene?.add(edge);
  buildingMeshes.set(building.id, mesh);
}

function updateRouteLine() {
  const command = props.buildings.find((item) => item.type === 'command');
  const selected = props.buildings.find((item) => item.id === props.selectedBuildingId);
  if (!scene || !command || !selected) return;

  if (routeLine) {
    scene.remove(routeLine);
    routeLine.geometry.dispose();
  }

  const points = [
    new THREE.Vector3(command.position[0], 0.08, command.position[1]),
    new THREE.Vector3(selected.position[0], 0.08, selected.position[1]),
  ];
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

  beacon.position.set(selected.position[0], selected.height + 0.6, selected.position[1]);
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
        ? 0.45
        : 0.12;
    mesh.scale.set(selected ? 1.08 : 1, selected ? 1.03 : 1, selected ? 1.08 : 1);
  });

  updateBeacon();
  updateRouteLine();
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

  const toScreen = (position: [number, number]) => ({
    x: width / 2 + position[0] * scale,
    y: height * 0.58 + position[1] * scale * 0.56,
  });

  const command = props.buildings.find((item) => item.type === 'command');
  const selected = props.buildings.find((item) => item.id === props.selectedBuildingId);
  if (command && selected) {
    const start = toScreen(command.position);
    const end = toScreen(selected.position);
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
    .sort((a, b) => a.position[1] - b.position[1])
    .forEach((building) => {
      const selectedBuilding = building.id === props.selectedBuildingId;
      const point = toScreen(building.position);
      const blockWidth = building.size[0] * scale * 0.72;
      const blockDepth = building.size[1] * scale * 0.42;
      const blockHeight = building.height * scale * 0.34;
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

  props.buildings.forEach(createBuilding);
  updateBuildingMaterials();
  resizeRenderer();

  resizeObserver = new ResizeObserver(resizeRenderer);
  resizeObserver.observe(sceneEl.value);
  sceneEl.value.addEventListener('pointerdown', handlePointerDown);
  animate();
});

watch(() => props.selectedBuildingId, updateBuildingMaterials);

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId);
  sceneEl.value?.removeEventListener('pointerdown', handlePointerDown);
  resizeObserver?.disconnect();
  controls?.dispose();
  renderer?.dispose();
  buildingMeshes.forEach((mesh) => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  buildingMeshes.clear();
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
