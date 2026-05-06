<template>
  <main class="cc-dashboard">
    <aside class="cc-sidebar cc-left">
      <section class="cc-panel cc-hero">
        <p class="cc-kicker">AI Command Center</p>
        <h1>城市级 AI 指挥调度</h1>
        <div class="cc-hero-grid">
          <div>
            <strong>{{ riskCounts.critical }}</strong>
            <span>严重</span>
          </div>
          <div>
            <strong>{{ riskCounts.warning }}</strong>
            <span>预警</span>
          </div>
          <div>
            <strong>{{ riskCounts.normal }}</strong>
            <span>正常</span>
          </div>
        </div>
      </section>

      <section class="cc-panel">
        <div class="cc-section-head">
          <h2>实时事件</h2>
          <span>{{ cityEvents.length }} 项</span>
        </div>
        <div class="cc-event-list">
          <button
            v-for="event in cityEvents"
            :key="event.id"
            class="cc-event-item"
            :class="[`is-${event.severity}`, { active: event.id === selectedEvent.id }]"
            type="button"
            @click="selectEvent(event.id)"
          >
            <span class="cc-event-time">{{ event.timestamp }}</span>
            <span class="cc-event-main">
              <strong>{{ event.title }}</strong>
              <small>{{ event.district }} / {{ event.category }}</small>
            </span>
            <span class="cc-status">{{ statusText[event.status] }}</span>
          </button>
        </div>
      </section>

      <section class="cc-panel">
        <div class="cc-section-head">
          <h2>图层</h2>
          <span>{{ enabledLayerCount }}/4</span>
        </div>
        <div class="cc-layer-list">
          <label v-for="layer in layerOptions" :key="layer.key" class="cc-layer-item">
            <input v-model="activeLayers[layer.key]" type="checkbox" />
            <span>{{ layer.label }}</span>
          </label>
        </div>
      </section>
    </aside>

    <section class="cc-stage">
      <div class="cc-stage-head">
        <div>
          <p class="cc-kicker">Live Situation</p>
          <h2>{{ selectedEvent.title }}</h2>
        </div>
        <div class="cc-stage-badges">
          <span :class="['cc-risk-badge', `is-${selectedEvent.severity}`]">
            {{ severityText[selectedEvent.severity] }}
          </span>
          <span>{{ selectedEvent.district }}</span>
        </div>
      </div>

      <div class="cc-map-wrap">
        <CityMap
          :active-layers="activeLayers"
          :center="cityCenter"
          :districts="districtAreas"
          :events="cityEvents"
          :roads="roadSegments"
          :routes="responseRoutes"
          :selected-event-id="selectedEvent.id"
          @select-event="selectEvent"
        />
      </div>

      <div class="cc-twin-wrap">
        <div class="cc-section-head">
          <h2>重点区域 3D</h2>
          <span>{{ selectedBuilding?.name }}</span>
        </div>
        <DigitalTwinScene
          :buildings="dispatchBuildings"
          :selected-building-id="selectedEvent.buildingId"
          @select-building="selectBuilding"
        />
      </div>
    </section>

    <aside class="cc-sidebar cc-right">
      <section class="cc-panel cc-analysis">
        <div class="cc-section-head">
          <h2>AI 分析</h2>
          <span>{{ selectedEvent.metrics.confidence }}%</span>
        </div>
        <p>{{ selectedEvent.impact }}</p>
        <div class="cc-recommendation">
          <span>建议</span>
          <strong>{{ selectedEvent.recommendation }}</strong>
        </div>
        <div class="cc-metric-row">
          <div>
            <strong>{{ formatNumber(selectedEvent.metrics.affectedPeople) }}</strong>
            <span>影响人数</span>
          </div>
          <div>
            <strong>{{ selectedEvent.metrics.etaMinutes }}m</strong>
            <span>处置 ETA</span>
          </div>
        </div>
      </section>

      <section class="cc-panel">
        <div class="cc-section-head">
          <h2>Agent 执行</h2>
          <span>{{ statusText[selectedEvent.status] }}</span>
        </div>
        <AgentTimeline :steps="selectedEvent.agentSteps" />
      </section>

      <section class="cc-panel">
        <div class="cc-section-head">
          <h2>风险趋势</h2>
          <span>近 50 分钟</span>
        </div>
        <RiskChart :trend="riskTrend" />
      </section>

      <section class="cc-panel">
        <div class="cc-section-head">
          <h2>资源负载</h2>
          <span>实时</span>
        </div>
        <div class="cc-resource-list">
          <div v-for="item in resourceMetrics" :key="item.name" class="cc-resource-item">
            <div class="cc-resource-head">
              <span>{{ item.name }}</span>
              <strong>{{ item.value }}/{{ item.capacity }}</strong>
            </div>
            <div class="cc-resource-track">
              <i :style="{ width: `${Math.round((item.value / item.capacity) * 100)}%` }" />
            </div>
          </div>
        </div>
      </section>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import AgentTimeline from '../components/command-center/AgentTimeline.vue';
import CityMap from '../components/command-center/CityMap.vue';
import DigitalTwinScene from '../components/command-center/DigitalTwinScene.vue';
import RiskChart from '../components/command-center/RiskChart.vue';
import {
  cityCenter,
  cityEvents,
  dispatchBuildings,
  districtAreas,
  resourceMetrics,
  responseRoutes,
  riskTrend,
  roadSegments,
} from '../data/commandCenter';
import type { DispatchLayerKey, EventStatus, RiskLevel } from '../types/commandCenter';

const selectedEventId = ref(cityEvents[0].id);

const activeLayers = reactive<Record<DispatchLayerKey, boolean>>({
  districts: true,
  roads: true,
  routes: true,
  events: true,
});

const layerOptions: Array<{ key: DispatchLayerKey; label: string }> = [
  { key: 'districts', label: '风险区域' },
  { key: 'roads', label: '道路网络' },
  { key: 'routes', label: '处置路线' },
  { key: 'events', label: '事件点位' },
];

const severityText: Record<RiskLevel, string> = {
  critical: '严重',
  warning: '预警',
  normal: '正常',
};

const statusText: Record<EventStatus, string> = {
  pending: '待处理',
  dispatching: '调度中',
  contained: '已控制',
};

const selectedEvent = computed(
  () => cityEvents.find((event) => event.id === selectedEventId.value) ?? cityEvents[0],
);

const selectedBuilding = computed(() =>
  dispatchBuildings.find((building) => building.id === selectedEvent.value.buildingId),
);

const riskCounts = computed(() =>
  cityEvents.reduce(
    (acc, event) => {
      acc[event.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, normal: 0 } as Record<RiskLevel, number>,
  ),
);

const enabledLayerCount = computed(
  () => Object.values(activeLayers).filter((enabled) => enabled).length,
);

function selectEvent(id: string) {
  selectedEventId.value = id;
}

function selectBuilding(id: string) {
  const event = cityEvents.find((item) => item.buildingId === id);
  if (event) selectEvent(event.id);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}
</script>
