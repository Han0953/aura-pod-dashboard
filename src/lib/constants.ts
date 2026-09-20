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
    max: 35.0,
    optimalMin: 21.0,
    optimalMax: 28.5,
    unit: "°C",
    toleranceStr: "21.0 – 28.5 °C",
  },
  gasIndex: {
    min: 0,
    max: 400,
    optimalMin: 0,
    optimalMax: 200,
    unit: "AQI Idx",
    toleranceStr: "0 – 200 Idx",
  },
};

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "monitoring", label: "Sensor Telemetry" },
  { id: "device", label: "Device Management" },
  { id: "analytics", label: "Analytics" },
  { id: "assistant", label: "Bio-AI Assistant", badge: "AI" },
  { id: "settings", label: "Settings" },
];

export const INITIAL_PIN_MAPPINGS: PinMapping[] = [
  {
    virtualPin: "V0",
    hardwarePin: "GPIO 4",
    sensorOrActuator: "DS18B20 Temp Sensor",
    direction: "Device → Dashboard",
    status: "Active",
  },
  {
    virtualPin: "V1",
    hardwarePin: "GPIO 34 (ADC1)",
    sensorOrActuator: "MQ-135 Gas Sensor",
    direction: "Device → Dashboard",
    status: "Active",
  },
  {
    virtualPin: "V2",
    hardwarePin: "GPIO 18",
    sensorOrActuator: "Grow Light LED (Relay CH1)",
    direction: "Device ↔ Dashboard",
    status: "Active",
  },
  {
    virtualPin: "V3",
    hardwarePin: "GPIO 19",
    sensorOrActuator: "Aerator Pump (Relay CH2)",
    direction: "Device ↔ Dashboard",
    status: "Active",
  },
  {
    virtualPin: "V4",
    hardwarePin: "Internal State",
    sensorOrActuator: "Mode Selector (0: Manual, 1: IoT)",
    direction: "Device ↔ Dashboard",
    status: "Active",
  },
];
