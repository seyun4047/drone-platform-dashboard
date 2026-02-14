
export interface User {
  id: string;
  username: string;
  token?: string;
}

export interface AuthResponse {
  status: boolean;
  message: string;
  data: {
    id?: string;
    token?: string;
  };
}

export interface TelemetryData {
  speed: number;
  person_count: number;
  longitude: number;
  latitude: number;
  power: number;
}

export interface DroneTelemetryResponse {
  data: TelemetryData;
  updatedAt: number;
}

export interface EventDetail {
  message: string;
  image: string;
}

export interface EventData {
  speed: number;
  person_count: number;
  longitude: number;
  latitude: number;
  power: number;
  event_detail: EventDetail;
  type?: 'ALERT' | 'INFO' | 'DANGER' | 'CRITICAL';
}

export interface DroneEventResponse {
  data: EventData;
  updatedAt: number;
}

export interface DroneInfo {
  serial: string;
  name: string;
  telemetry?: TelemetryData;
  event?: EventData;
  lastUpdate?: number;
}

export enum RefreshInterval {
  OFF = 0,
  SEC_1 = 1000,
  SEC_3 = 3000,
  SEC_5 = 5000,
  SEC_10 = 10000,
  SEC_30 = 30000,
  MIN_1 = 60000,
  MIN_5 = 300000,
  MIN_10 = 600000
}
