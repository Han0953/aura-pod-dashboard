# AURA Pod Dashboard Components

## Layout Components
### Sidebar
Branding, navigation, and active section.

### Topbar
System status, last update/context, and dashboard context.

## Data Components
### SensorCard
Shows title, value, unit, status, icon, and optional trend.

Conceptual props:
```ts
{
  title: string;
  value: number | string;
  unit?: string;
  status?: string;
  icon?: ReactNode;
}
```

### SensorChart
Shows a time-series trend for a sensor.

Conceptual props:
```ts
{
  title: string;
  data: SensorPoint[];
  unit?: string;
}
```

### StatusBadge
States: Online, Offline, Normal, Warning, Error, Active, Inactive.

## Device Components
### DeviceStatusCard
Shows ESP32, LED, and Aerator state.

### DeviceControl
Provides supported ON/OFF controls through Blynk.

## MRV Components
### CarbonMetricCard
Shows estimated carbon metric.

### BiomassMetricCard
Shows biomass-related metric when data exists.

## Shared Rules
- Reuse components.
- Use typed props.
- Prefer Lucide icons.
- Support loading/error/empty states where relevant.
