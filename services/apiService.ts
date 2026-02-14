
import { 
  AuthResponse, 
  DroneTelemetryResponse, 
  DroneEventResponse 
} from '../types';
import { ENV } from '../env';

/**
 * Generic request helper to communicate with the Spring Boot backend.
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('access_token');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${ENV.BASE_URL}${cleanEndpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Auth'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // 세션 만료 체크
    if (response.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new Error(`Invalid JSON: ${text.substring(0, 50)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `API Error [${response.status}]`);
    }
    
    return data;
  } catch (error: any) {
    if (error.message === 'AUTH_EXPIRED') throw error;
    if (error.message === 'Failed to fetch') {
      throw new Error('NETWORK_ERROR: Server unreachable.');
    }
    throw error;
  }
}

export const apiService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    if (ENV.ENABLE_MOCK) {
      return { status: true, message: 'OK', data: { id: username, token: 'mock' } };
    }
    return request<AuthResponse>('/dashboard/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async register(username: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/dashboard/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async getAliveDrones(): Promise<string[]> {
    if (ENV.ENABLE_MOCK) return ["Aero-X1", "Sentinel-V2"];
    return request<string[]>('/api/dashboard/alive-drones');
  },

  async getTelemetry(serial: string): Promise<DroneTelemetryResponse> {
    return request<DroneTelemetryResponse>(`/api/dashboard/drone/telemetry/${serial}`);
  },

  async getEvent(serial: string): Promise<DroneEventResponse> {
    return request<DroneEventResponse>(`/api/dashboard/drone/event/${serial}`);
  }
};
