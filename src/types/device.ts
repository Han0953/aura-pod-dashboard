/**
 * Device & Hardware Types matching agent.md/documentation/DATA_MODEL.md & BLYNK.md
 */

export interface DeviceStatus {
  online: boolean;
  led: boolean;
  aerator: boolean;
  mode: "manual" | "iot";
}

export interface HardwareDiagnostic {
  deviceId: string;
  deviceName: string;
  firmwareVersion: string;
  uptime: string;
  wifiSsid: string;
  wifiSignalDbm: number;
  ipAddress: string;
  cpuFrequencyMhz: number;
  freeHeapKb: number;
  lastSeen: string;
  cpuLoadPercent?: number;
  heapFragmentationPercent?: number;
  pingMs?: number;
}

export interface PinMapping {
  virtualPin: string;
  hardwarePin: string;
  sensorOrActuator: string;
  direction: "Device → Dashboard" | "Device ↔ Dashboard";
  status: "Active" | "Standby" | "TBD";
}
