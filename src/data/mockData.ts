import { SensorData, MultiSeriesSensorPoint } from "@/types/sensor";
import { DeviceStatus, HardwareDiagnostic } from "@/types/device";
import { CarbonMetric, BiomassMetric } from "@/types/mrv";

export const INITIAL_SENSOR_DATA: SensorData = {
  temperature: 24.3,
  gasIndex: 142,
  timestamp: new Date().toISOString(),
};

export const INITIAL_DEVICE_STATUS: DeviceStatus = {
  online: false,
  led: false,
  aerator: false,
  mode: "manual",
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
export function generateTelemetryHistory(range: "1H" | "6H" | "24H" | "7D"): MultiSeriesSensorPoint[] {
  const points: MultiSeriesSensorPoint[] = [];
  const now = Date.now();

  let count = 12;
  let intervalMs = 5 * 60 * 1000; // 5 min for 1H

  if (range === "6H") {
    count = 18;
    intervalMs = 20 * 60 * 1000;
  } else if (range === "24H") {
    count = 24;
    intervalMs = 60 * 60 * 1000;
  } else if (range === "7D") {
    count = 14;
    intervalMs = 12 * 60 * 60 * 1000;
  }

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now - i * intervalMs);
    const timeLabel =
      range === "7D"
        ? time.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
        : time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    // Micro-sine wave simulation for biological consistency
    const phase = (count - i) / 3;
    const temp = Number((24.2 + Math.sin(phase) * 0.8 + (Math.random() * 0.2 - 0.1)).toFixed(1));
    const gas = Math.round(140 + Math.sin(phase * 1.2) * 15 + (Math.random() * 10 - 5));

    points.push({
      timestamp: time.toISOString(),
      timeLabel,
      temperature: temp,
      gasIndex: gas,
    });
  }

  return points;
}
