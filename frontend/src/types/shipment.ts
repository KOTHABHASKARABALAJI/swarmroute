export type ShipmentStatus = 'in-transit' | 'at-risk' | 'delayed' | 'delivered' | 'processing';
export type TransportMode = 'truck' | 'ship' | 'plane' | 'bike';
export type Priority = 'cost' | 'speed' | 'safety';
export type NotificationSeverity = 'high' | 'medium' | 'low';
export type NotificationType = 'route-change' | 'risk-alert' | 'optimization' | 'system';

export interface Shipment {
  id: string;
  source: string;
  destination: string;
  sourceCoords: [number, number]; // [lat, lng]
  destCoords: [number, number];
  transportMode: TransportMode;
  shipmentType: string;
  departureTime: string;
  deliveryDeadline: string;
  priorities: Priority[];
  status: ShipmentStatus;
  riskScore: number;
  progress: number; // 0-100
  eta: string;
  routes: Route[];
  activeRouteIndex: number;
}

export interface Route {
  id: string;
  name: string;
  time: string;
  cost: string;
  risk: number;
  waypoints: string[];
  active: boolean;
}

export interface Notification {
  id: string;
  shipmentId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  icon: string;
}

export interface AILogEntry {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  timestamp: Date;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  type: 'departure' | 'risk' | 'reroute' | 'arrival' | 'info';
}