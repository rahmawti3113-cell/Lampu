export interface SensorData {
  time: string;
  temperature: number;
  humidity: number;
}

export interface ESPState {
  temperature: number;
  humidity: number;
  relays: boolean[];
  variasiMode: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'simulating';
