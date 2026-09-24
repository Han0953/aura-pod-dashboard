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
    label: "Culture Temperature",
    min: 15.0,
    max: 40.0,
    lowAlert: 20.0,
    optimalMin: 22.0,
    optimalMax: 30.0,
    highAlert: 30.0,
    criticalAlert: 35.0,
    unit: "°C",
    toleranceStr: "22.0 – 30.0 °C",
    note: "Ambang pemantauan awal (panduan awal yang dapat disesuaikan dengan kondisi kultur)",
  },
  gasIndex: {
    label: "Headspace Gas Index",
    min: 0,
    max: 400,
    optimalMin: 0,
    optimalMax: 200,
    unit: "Idx",
    toleranceStr: "0 – 200 Idx (Ambang Sementara)",
    calibrated: false,
    note: "Indikator relatif respons sensor gas ruang atas, bukan pengukuran CO₂ ppm atau AQI standar",
  },
};

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "monitoring", label: "Sensor Telemetry" },
  { id: "device", label: "Device Management" },
  { id: "analytics", label: "Analytics" },
  { id: "assistant", label: "AI Assistant", badge: "AI" },
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
