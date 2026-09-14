# AURA Pod Dashboard Data Model

## Sensor Data
```ts
export interface SensorData {
  temperature: number;
  ph: number | null;
  gasIndex: number | null;
  timestamp: string;
}
```

## Device Status
```ts
export interface DeviceStatus {
  online: boolean;
  led: boolean;
  aerator: boolean;
}
```

## Dashboard State
```ts
export interface DashboardState {
  sensor: SensorData;
  device: DeviceStatus;
}
```

## Chart Point
```ts
export interface SensorPoint {
  timestamp: string;
  value: number;
}
```

## Rules
- Temperature uses Celsius.
- pH may be null if unavailable.
- gasIndex is relative MQ-135 monitoring, not validated CO2 ppm.
- Timestamp format must be consistent.
- Do not convert null into fabricated numbers.

## Carbon Metric
Carbon capture data is not yet defined as a validated measured quantity. For UI structure only:
```ts
export interface CarbonMetric {
  value: number;
  unit: string;
  estimated: boolean;
  timestamp: string;
}
```
Mark such data as Estimated/Prototype unless validated.

## Mock Data
Only for development, screenshots, and tests. Clearly label mock/simulated values.
