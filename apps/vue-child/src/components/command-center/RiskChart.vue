<template>
  <div ref="chartEl" class="cc-chart" aria-label="风险趋势图"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { RiskTrendPoint } from '../../types/commandCenter';

const props = defineProps<{
  trend: RiskTrendPoint[];
}>();

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const chartEl = ref<HTMLDivElement | null>(null);
let chart: ReturnType<typeof echarts.init> | null = null;
let resizeObserver: ResizeObserver | null = null;

function renderChart() {
  if (!chart) return;

  chart.setOption({
    animationDuration: 450,
    grid: { left: 32, right: 10, top: 28, bottom: 24 },
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: 'rgba(255,255,255,0.74)', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 6,
    },
    xAxis: {
      type: 'category',
      data: props.trend.map((item) => item.time),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.18)' } },
      axisLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 10 },
    },
    series: [
      {
        name: '严重',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: props.trend.map((item) => item.critical),
        lineStyle: { color: '#ef4444', width: 2 },
        itemStyle: { color: '#ef4444' },
      },
      {
        name: '预警',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: props.trend.map((item) => item.warning),
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: '正常',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: props.trend.map((item) => item.normal),
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' },
      },
    ],
  });
}

onMounted(() => {
  if (!chartEl.value) return;

  chart = echarts.init(chartEl.value, undefined, { renderer: 'canvas' });
  renderChart();
  resizeObserver = new ResizeObserver(() => chart?.resize());
  resizeObserver.observe(chartEl.value);
});

watch(() => props.trend, renderChart, { deep: true });

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
  chart = null;
});
</script>
