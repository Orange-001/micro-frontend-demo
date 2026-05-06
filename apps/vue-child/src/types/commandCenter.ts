export type RiskLevel = 'critical' | 'warning' | 'normal';

export type EventStatus = 'pending' | 'dispatching' | 'contained';

export type AgentStepStatus = 'done' | 'running' | 'waiting';

export type DispatchLayerKey = 'districts' | 'roads' | 'routes' | 'events';

export type CityId = 'guangzhou' | 'shenzhen';

export interface CityOption {
  id: CityId;
  name: string;
}

export interface DistrictArea {
  id: string;
  name: string;
  risk: RiskLevel;
  polygon: Array<[number, number]>;
}

export interface RoadSegment {
  id: string;
  name: string;
  level: 'main' | 'secondary';
  path: Array<[number, number]>;
}

export interface ResponseRoute {
  id: string;
  eventId: string;
  path: Array<[number, number]>;
}

export interface DispatchBuilding {
  id: string;
  name: string;
  type: 'command' | 'transit' | 'energy' | 'medical' | 'security' | 'storage';
  status: RiskLevel;
  coordinate: [number, number];
  footprint?: Array<[number, number]>;
  heightMeters: number;
  position?: [number, number];
  size?: [number, number];
  height?: number;
  source: string;
}

export interface AgentStep {
  id: string;
  title: string;
  detail: string;
  status: AgentStepStatus;
  tool: string;
  elapsed: string;
}

export interface CityEvent {
  id: string;
  title: string;
  category: string;
  severity: RiskLevel;
  status: EventStatus;
  district: string;
  coordinate: [number, number];
  buildingId: string;
  timestamp: string;
  impact: string;
  recommendation: string;
  metrics: {
    affectedPeople: number;
    etaMinutes: number;
    confidence: number;
  };
  agentSteps: AgentStep[];
}

export interface RiskTrendPoint {
  time: string;
  critical: number;
  warning: number;
  normal: number;
}

export interface ResourceMetric {
  name: string;
  value: number;
  capacity: number;
}

export interface WeatherProfile {
  latitude: number;
  longitude: number;
  label: string;
}

export interface WeatherTrendPoint {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export interface OsmBuildingSource {
  bbox: [number, number, number, number];
  label: string;
}

export interface CommandCenterData {
  id: CityId;
  name: string;
  center: [number, number];
  mapZoom: number;
  osmBuildings: OsmBuildingSource;
  weather: WeatherProfile;
  districts: DistrictArea[];
  roads: RoadSegment[];
  routes: ResponseRoute[];
  buildings: DispatchBuilding[];
  events: CityEvent[];
  riskTrend: RiskTrendPoint[];
  resources: ResourceMetric[];
}
