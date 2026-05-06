<template>
  <div ref="chartEl" class="cc-chart" aria-label="风险趋势图"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type {
  CityId,
  RiskTrendPoint,
  WeatherProfile,
  WeatherTrendPoint,
} from '../../types/commandCenter';

const props = defineProps<{
  cityId: CityId;
  trend: RiskTrendPoint[];
  weather: WeatherProfile;
}>();

interface OpenMeteoResponse {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    wind_speed_10m?: number[];
  };
}

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const chartEl = ref<HTMLDivElement | null>(null);
const weatherTrend = ref<WeatherTrendPoint[]>([]);
let chart: ReturnType<typeof echarts.init> | null = null;
let resizeObserver: ResizeObserver | null = null;
let weatherRequestId = 0;

function renderChart() {
  if (!chart) return;

  if (weatherTrend.value.length) {
    chart.setOption(
      {
        animationDuration: 450,
        grid: { left: 32, right: 36, top: 28, bottom: 24 },
        tooltip: {
          trigger: 'axis',
          valueFormatter(value: unknown) {
            return typeof value === 'number' ? value.toFixed(1) : String(value);
          },
        },
        legend: {
          top: 0,
          right: 0,
          textStyle: { color: 'rgba(255,255,255,0.74)', fontSize: 11 },
          itemWidth: 10,
          itemHeight: 6,
        },
        xAxis: {
          type: 'category',
          data: weatherTrend.value.map((item) => item.time),
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.18)' } },
          axisLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 10 },
          axisTick: { show: false },
        },
        yAxis: [
          {
            type: 'value',
            name: '温度/风速',
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
            axisLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 10 },
            nameTextStyle: { color: 'rgba(255,255,255,0.52)', fontSize: 10 },
          },
          {
            type: 'value',
            name: '湿度',
            min: 0,
            max: 100,
            splitLine: { show: false },
            axisLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 10 },
            nameTextStyle: { color: 'rgba(255,255,255,0.52)', fontSize: 10 },
          },
        ],
        series: [
          {
            name: '温度°C',
            type: 'line',
            smooth: true,
            symbolSize: 5,
            data: weatherTrend.value.map((item) => item.temperature),
            lineStyle: { color: '#ef4444', width: 2 },
            itemStyle: { color: '#ef4444' },
          },
          {
            name: '湿度%',
            type: 'line',
            smooth: true,
            yAxisIndex: 1,
            symbolSize: 5,
            data: weatherTrend.value.map((item) => item.humidity),
            lineStyle: { color: '#38bdf8', width: 2 },
            itemStyle: { color: '#38bdf8' },
          },
          {
            name: '风速km/h',
            type: 'line',
            smooth: true,
            symbolSize: 5,
            data: weatherTrend.value.map((item) => item.windSpeed),
            lineStyle: { color: '#22c55e', width: 2 },
            itemStyle: { color: '#22c55e' },
          },
        ],
      },
      true,
    );
    return;
  }

  chart.setOption(
    {
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
    },
    true,
  );
}

function normalizeWeatherTrend(data: OpenMeteoResponse) {
  const hourly = data.hourly;
  const times = hourly?.time ?? [];
  const temperatures = hourly?.temperature_2m ?? [];
  const humidity = hourly?.relative_humidity_2m ?? [];
  const windSpeed = hourly?.wind_speed_10m ?? [];
  const currentHour = new Date().getHours();
  const startIndex = Math.max(
    0,
    times.findIndex((time) => Number(time.slice(11, 13)) >= currentHour),
  );

  return times
    .slice(startIndex, startIndex + 12)
    .map((time, index) => ({
      time: time.slice(11, 16),
      temperature: Number(temperatures[startIndex + index]),
      humidity: Number(humidity[startIndex + index]),
      windSpeed: Number(windSpeed[startIndex + index]),
    }))
    .filter((item) => {
      return (
        Number.isFinite(item.temperature) &&
        Number.isFinite(item.humidity) &&
        Number.isFinite(item.windSpeed)
      );
    });
}

async function loadWeatherTrend() {
  const requestId = ++weatherRequestId;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(props.weather.latitude));
  url.searchParams.set('longitude', String(props.weather.longitude));
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,wind_speed_10m');
  url.searchParams.set('forecast_days', '2');
  url.searchParams.set('timezone', 'Asia/Shanghai');

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);

    const data = (await response.json()) as OpenMeteoResponse;
    if (requestId !== weatherRequestId) return;

    weatherTrend.value = normalizeWeatherTrend(data);
  } catch {
    if (requestId !== weatherRequestId) return;
    weatherTrend.value = [];
  } finally {
    renderChart();
  }
}

onMounted(() => {
  if (!chartEl.value) return;

  chart = echarts.init(chartEl.value, undefined, { renderer: 'canvas' });
  renderChart();
  resizeObserver = new ResizeObserver(() => chart?.resize());
  resizeObserver.observe(chartEl.value);
});

watch(() => props.trend, renderChart, { deep: true });
watch(() => [props.cityId, props.weather.latitude, props.weather.longitude], loadWeatherTrend, {
  immediate: true,
});

onBeforeUnmount(() => {
  weatherRequestId += 1;
  resizeObserver?.disconnect();
  chart?.dispose();
  chart = null;
});
</script>
