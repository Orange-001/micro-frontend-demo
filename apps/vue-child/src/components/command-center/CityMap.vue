<template>
  <div ref="mapEl" class="cc-map" aria-label="城市态势地图"></div>
</template>

<script setup lang="ts">
import 'ol/ol.css';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { LineString, Point, Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import type { Coordinate } from 'ol/coordinate';
import type {
  CityEvent,
  DispatchLayerKey,
  DistrictArea,
  ResponseRoute,
  RiskLevel,
  RoadSegment,
} from '../../types/commandCenter';

const props = defineProps<{
  center: [number, number];
  zoom: number;
  districts: DistrictArea[];
  roads: RoadSegment[];
  routes: ResponseRoute[];
  events: CityEvent[];
  activeLayers: Record<DispatchLayerKey, boolean>;
  selectedEventId: string;
}>();

const emit = defineEmits<{
  selectEvent: [id: string];
}>();

let map: Map | null = null;
let resizeObserver: ResizeObserver | null = null;
let baseLayer: TileLayer<OSM> | null = null;
let districtLayer: VectorLayer<VectorSource<Feature>> | null = null;
let roadLayer: VectorLayer<VectorSource<Feature>> | null = null;
let routeLayer: VectorLayer<VectorSource<Feature>> | null = null;
let eventLayer: VectorLayer<VectorSource<Feature>> | null = null;

const mapEl = ref<HTMLDivElement | null>(null);

const riskColorMap: Record<RiskLevel, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  normal: '#22c55e',
};

function projectPath(path: Array<[number, number]>): Coordinate[] {
  return path.map((item) => fromLonLat(item));
}

function createDistrictLayer() {
  const source = new VectorSource<Feature>({
    features: props.districts.map((area) => {
      const feature = new Feature({
        geometry: new Polygon([projectPath(area.polygon)]),
        name: area.name,
        risk: area.risk,
      });
      feature.setId(area.id);
      return feature;
    }),
  });

  return new VectorLayer({
    source,
    style(feature) {
      const risk = feature.get('risk') as RiskLevel;
      const color = riskColorMap[risk];
      return new Style({
        fill: new Fill({ color: `${color}22` }),
        stroke: new Stroke({ color: `${color}aa`, width: 1.5 }),
        text: new Text({
          text: feature.get('name') as string,
          fill: new Fill({ color: '#f8fafc' }),
          stroke: new Stroke({ color: '#111827', width: 3 }),
          font: '12px system-ui, sans-serif',
        }),
      });
    },
  });
}

function createRoadLayer() {
  const source = new VectorSource<Feature>({
    features: props.roads.map((road) => {
      const feature = new Feature({
        geometry: new LineString(projectPath(road.path)),
        name: road.name,
        level: road.level,
      });
      feature.setId(road.id);
      return feature;
    }),
  });

  return new VectorLayer({
    source,
    style(feature) {
      const level = feature.get('level') as RoadSegment['level'];
      return new Style({
        stroke: new Stroke({
          color: level === 'main' ? '#60a5fa' : '#94a3b8',
          width: level === 'main' ? 3 : 1.5,
          lineDash: level === 'main' ? undefined : [5, 6],
        }),
      });
    },
  });
}

function createRouteLayer() {
  const source = new VectorSource<Feature>({
    features: props.routes.map((route) => {
      const feature = new Feature({
        geometry: new LineString(projectPath(route.path)),
        eventId: route.eventId,
      });
      feature.setId(route.id);
      return feature;
    }),
  });

  return new VectorLayer({
    source,
    style(feature) {
      const eventId = feature.get('eventId') as string;
      if (eventId !== props.selectedEventId) {
        return new Style({
          stroke: new Stroke({ color: 'rgba(0,0,0,0)', width: 0 }),
        });
      }

      return [
        new Style({
          stroke: new Stroke({ color: '#111827', width: 6 }),
        }),
        new Style({
          stroke: new Stroke({ color: '#38bdf8', width: 3, lineDash: [8, 8] }),
        }),
      ];
    },
  });
}

function createEventLayer() {
  const source = new VectorSource<Feature>({
    features: props.events.map((event) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(event.coordinate)),
        eventId: event.id,
        title: event.title,
        severity: event.severity,
      });
      feature.setId(event.id);
      return feature;
    }),
  });

  return new VectorLayer({
    source,
    style(feature) {
      const eventId = feature.get('eventId') as string;
      const severity = feature.get('severity') as RiskLevel;
      const selected = eventId === props.selectedEventId;
      const color = riskColorMap[severity];

      return [
        new Style({
          image: new CircleStyle({
            radius: selected ? 15 : 11,
            fill: new Fill({ color: `${color}35` }),
            stroke: new Stroke({ color, width: selected ? 3 : 2 }),
          }),
        }),
        new Style({
          image: new CircleStyle({
            radius: selected ? 5 : 4,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#111827', width: 1 }),
          }),
          text: selected
            ? new Text({
                text: feature.get('title') as string,
                offsetY: -24,
                fill: new Fill({ color: '#ffffff' }),
                stroke: new Stroke({ color: '#111827', width: 4 }),
                font: '600 12px system-ui, sans-serif',
              })
            : undefined,
        }),
      ];
    },
  });
}

function syncLayerVisibility() {
  districtLayer?.setVisible(props.activeLayers.districts);
  roadLayer?.setVisible(props.activeLayers.roads);
  routeLayer?.setVisible(props.activeLayers.routes);
  eventLayer?.setVisible(props.activeLayers.events);
}

function rebuildVectorLayers() {
  if (!map) return;

  [districtLayer, roadLayer, routeLayer, eventLayer].forEach((layer) => {
    if (layer) map?.removeLayer(layer);
  });

  districtLayer = createDistrictLayer();
  roadLayer = createRoadLayer();
  routeLayer = createRouteLayer();
  eventLayer = createEventLayer();

  map.addLayer(districtLayer);
  map.addLayer(roadLayer);
  map.addLayer(routeLayer);
  map.addLayer(eventLayer);
  syncLayerVisibility();
}

function focusSelectedEvent() {
  const selected = props.events.find((item) => item.id === props.selectedEventId);
  if (!selected || !map) return;

  map.getView().animate({
    center: fromLonLat(selected.coordinate),
    zoom: Math.max(props.zoom + 1.2, 13.7),
    duration: 450,
  });

  eventLayer?.changed();
  routeLayer?.changed();
}

onMounted(() => {
  if (!mapEl.value) return;

  baseLayer = new TileLayer({
    source: new OSM({
      attributions: '© OpenStreetMap contributors',
      crossOrigin: 'anonymous',
    }),
  });

  map = new Map({
    target: mapEl.value,
    layers: [baseLayer],
    view: new View({
      center: fromLonLat(props.center),
      zoom: props.zoom,
      minZoom: 10,
      maxZoom: 16,
    }),
    controls: [],
  });

  map.on('singleclick', (event) => {
    map?.forEachFeatureAtPixel(event.pixel, (feature) => {
      const eventId = feature.get('eventId') as string | undefined;
      if (eventId) emit('selectEvent', eventId);
    });
  });

  resizeObserver = new ResizeObserver(() => map?.updateSize());
  resizeObserver.observe(mapEl.value);
  rebuildVectorLayers();
  focusSelectedEvent();
});

watch(() => props.activeLayers, syncLayerVisibility, { deep: true });
watch(() => props.selectedEventId, focusSelectedEvent);
watch(
  () => [props.center, props.zoom, props.districts, props.roads, props.routes, props.events],
  () => {
    if (!map) return;

    map.getView().setCenter(fromLonLat(props.center));
    map.getView().setZoom(props.zoom);
    rebuildVectorLayers();
    focusSelectedEvent();
  },
  { deep: true },
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  map?.setTarget(undefined);
  map = null;
});
</script>
