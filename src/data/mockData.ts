import { SensorData, MultiSeriesSensorPoint, TimeRange } from "@/types/sensor";
import { DeviceStatus, HardwareDiagnostic } from "@/types/device";
import { CarbonMetric, BiomassMetric } from "@/types/mrv";

export const INITIAL_SENSOR_DATA: SensorData = {
  temperature: 0,
  gasIndex: null,
  timestamp: new Date().toISOString(),
};

export const INITIAL_DEVICE_STATUS: DeviceStatus = {
  online: false,
  led: false,
  aerator: false,
  mode: "iot",
};

export const MOCK_HARDWARE_DIAGNOSTICS: HardwareDiagnostic = {
  deviceId: "AURA-POD-ESP32-01",
  deviceName: "AURA Pod Microalgae System #1",
  firmwareVersion: "v1.4.2-aurapod-blynk",
  uptime: "4d 18h 32m",
  wifiSsid: "AlgaLab-IoT-5G",
  wifiSignalDbm: -58,
  ipAddress: "192.168.1.144",
  cpuFrequencyMhz: 240,
  freeHeapKb: 184,
  lastSeen: "Just now (sync: 2s ago)",
};

export const MOCK_CARBON_METRIC: CarbonMetric = {
  value: 0.142,
  unit: "kg CO₂/day",
  estimated: true,
  timestamp: new Date().toISOString(),
  sequestrationDailyKg: 0.142,
  efficiencyPercent: 94.8,
};

export const MOCK_BIOMASS_METRIC: BiomassMetric = {
  opticalDensity680: 1.28,
  dryBiomassDensityGPerL: 0.84,
  estimated: true,
  timestamp: new Date().toISOString(),
};

// Generates realistic telemetry points for time-series charts
export function generateTelemetryHistory(range: TimeRange): MultiSeriesSensorPoint[] {
  const points: MultiSeriesSensorPoint[] = [];
  const now = Date.now();

  let count = 12;
  let intervalMs = 5 * 60 * 1000; // 5 min for 1H

  if (range === "24H") {
    count = 24;
    intervalMs = 60 * 60 * 1000; // 1 hour for 24H
  } else if (range === "7D") {
    count = 14;
    intervalMs = 12 * 60 * 60 * 1000; // 12 hours for 7D
  } else if (range === "30D") {
    count = 30;
    intervalMs = 24 * 60 * 60 * 1000; // 1 day for 30D
  }

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now - i * intervalMs);
    let timeLabel = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    if (range === "7D") {
      timeLabel = time.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    } else if (range === "30D") {
      timeLabel = time.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    points.push({
      timestamp: time.toISOString(),
      timeLabel,
      temperature: 0,
      gasIndex: 0,
    });
  }

  return points;
}
