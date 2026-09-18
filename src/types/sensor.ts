/**
 * Sensor Types matching agent.md/documentation/DATA_MODEL.md
 */

export interface SensorData {
  temperature: number;
  gasIndex: number | null;
  timestamp: string;
}

export interface SensorPoint {
  timestamp: string;
  value: number;
}

export interface MultiSeriesSensorPoint {
  timestamp: string;
  timeLabel: string;
  temperature: number;
  gasIndex: number | null;
}

export type TimeRange = "1H" | "24H" | "7D" | "30D";

export interface SensorThresholds {
  min: number;
  max: number;
  unit: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export type SensorStatusLevel = "normal" | "warning" | "error" | "unavailable";

export interface SensorMetadata {
  id: "temperature" | "gasIndex";
  label: string;
  hardwareSensor: string;
  unit: string;
  targetRange: string;
  description: string;
  status: SensorStatusLevel;
}
