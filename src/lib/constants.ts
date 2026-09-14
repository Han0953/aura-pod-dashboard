import { NavItem } from "@/types/navigation";
import { PinMapping } from "@/types/device";

export const APP_CONFIG = {
  name: "AURA Pod",
  fullName: "AURA Pod Bioreactor",
  tagline: "Microalgae Photobioreactor IoT Platform",
  version: "v0.1.2-beta",
  deviceId: "AURA-POD-ESP32-01",
  refreshIntervalMs: 5000,
};

export const SENSOR_THRESHOLDS = {
  temperature: {
    min: 18.0,
    max: 32.0,
    optimalMin: 22.0,
    optimalMax: 26.0,
    unit: "°C",
    toleranceStr: "22.0 – 26.0 °C",
  },
  gasIndex: {
    min: 50,
    max: 350,
    optimalMin: 100,
    optimalMax: 180,
    unit: "AQI Idx",
    toleranceStr: "100 – 180 Idx",
  },
};

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "monitoring", label: "Sensor Telemetry" },
  { id: "device", label: "Device Management" },
  { id: "analytics", label: "Analytics", badge: "Soon", disabled: true },
  { id: "settings", label: "Settings", badge: "Soon", disabled: true },
];

export const INITIAL_PIN_MAPPINGS: PinMapping[] = [
  {
    virtualPin: "V0 (TBD)",
    hardwarePin: "GPIO 4",
    sensorOrActuator: "DS18B20 Temp Sensor",
    direction: "Device → Dashboard",
    status: "Active",
  },
  {
    virtualPin: "V2 (TBD)",
    hardwarePin: "GPIO 35 (ADC1)",
    sensorOrActuator: "MQ-135 Gas Sensor",
    direction: "Device → Dashboard",
    status: "Active",
  },
  {
    virtualPin: "V3 (TBD)",
    hardwarePin: "GPIO 18",
    sensorOrActuator: "Grow Light LED",
    direction: "Device ↔ Dashboard",
    status: "Active",
  },
  {
    virtualPin: "V4 (TBD)",
    hardwarePin: "GPIO 19",
    sensorOrActuator: "Aerator Pump",
    direction: "Device ↔ Dashboard",
    status: "Active",
  },
];
