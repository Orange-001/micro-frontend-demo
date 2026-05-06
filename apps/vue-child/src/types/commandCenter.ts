export type RiskLevel = 'critical' | 'warning' | 'normal';

export type EventStatus = 'pending' | 'dispatching' | 'contained';

export type AgentStepStatus = 'done' | 'running' | 'waiting';

export type DispatchLayerKey = 'districts' | 'roads' | 'routes' | 'events';

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
  position: [number, number];
  size: [number, number];
  height: number;
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
