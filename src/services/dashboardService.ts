import { useState, useEffect, useCallback } from "react";
import { SensorData, MultiSeriesSensorPoint } from "@/types/sensor";
import { DeviceStatus, HardwareDiagnostic } from "@/types/device";
import { CarbonMetric, BiomassMetric } from "@/types/mrv";
import {
  INITIAL_SENSOR_DATA,
  INITIAL_DEVICE_STATUS,
  MOCK_HARDWARE_DIAGNOSTICS,
  MOCK_CARBON_METRIC,
  MOCK_BIOMASS_METRIC,
  generateTelemetryHistory,
} from "@/data/mockData";
import { APP_CONFIG } from "@/lib/constants";
import { blynkService } from "./blynkService";

export interface DashboardContextType {
  sensorData: SensorData;
  deviceStatus: DeviceStatus;
  diagnostics: HardwareDiagnostic;
  carbonMetric: CarbonMetric;
  biomassMetric: BiomassMetric;
  telemetryHistory: MultiSeriesSensorPoint[];
  timeRange: "1H" | "6H" | "24H" | "7D";
  setTimeRange: (range: "1H" | "6H" | "24H" | "7D") => void;
  lastUpdatedText: string;
  isRefreshing: boolean;
  isBlynkConfigured: boolean;
  toggleLed: () => void;
  toggleAerator: () => void;
  toggleMode: () => void;
  toggleOnline: () => void;
  refreshData: () => void;
}

export function useDashboardData(): DashboardContextType {
  const [sensorData, setSensorData] = useState<SensorData>(INITIAL_SENSOR_DATA);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(INITIAL_DEVICE_STATUS);
  const [diagnostics] = useState<HardwareDiagnostic>(MOCK_HARDWARE_DIAGNOSTICS);
  const [carbonMetric] = useState<CarbonMetric>(MOCK_CARBON_METRIC);
  const [biomassMetric] = useState<BiomassMetric>(MOCK_BIOMASS_METRIC);
  const [timeRange, setTimeRange] = useState<"1H" | "6H" | "24H" | "7D">("1H");
  const [telemetryHistory, setTelemetryHistory] = useState<MultiSeriesSensorPoint[]>(() =>
    generateTelemetryHistory("1H")
  );
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [lastUpdatedText, setLastUpdatedText] = useState<string>("Just now");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const isBlynkConfigured = blynkService.isConfigured();

  // Update telemetry history when timeRange changes
  useEffect(() => {
    setTelemetryHistory(generateTelemetryHistory(timeRange));
  }, [timeRange]);

  // Relative time counter
  useEffect(() => {
    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
      if (diffSec < 5) {
        setLastUpdatedText("Just now");
      } else if (diffSec < 60) {
        setLastUpdatedText(`${diffSec}s ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setLastUpdatedText(`${diffMin}m ago`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  // Live Sync with Blynk Cloud REST API (V0 - V4)
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (blynkService.isConfigured()) {
        const [isOnline, blynkData] = await Promise.all([
          blynkService.checkHardwareConnected(),
          blynkService.fetchAllPins(),
        ]);

        setDeviceStatus((prev) => ({
          ...prev,
          online: isOnline,
          led: blynkData ? blynkData.led : prev.led,
          aerator: blynkData ? blynkData.aerator : prev.aerator,
          mode: blynkData ? blynkData.mode : prev.mode,
        }));

        if (blynkData) {
          setSensorData({
            temperature: blynkData.temperature,
            gasIndex: blynkData.gasIndex,
            timestamp: new Date().toISOString(),
          });

          // Append live telemetry point to historical graph
          const now = new Date();
          const timeLabel = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });

          setTelemetryHistory((prev) => {
            const nextPoint: MultiSeriesSensorPoint = {
              timestamp: now.toISOString(),
              timeLabel,
              temperature: blynkData.temperature,
              gasIndex: blynkData.gasIndex,
            };
            return [...prev.slice(1), nextPoint];
          });
        }
        setLastSyncTime(new Date());
      } else {
        // Fallback simulation mode if token not set
        setSensorData((prev) => {
          if (!deviceStatus.online) return prev;
          const tempDelta = (Math.random() * 0.4 - 0.2);
          const nextTemp = Math.min(27.5, Math.max(21.5, Number((prev.temperature + tempDelta).toFixed(1))));
          const gasDelta = Math.round(Math.random() * 8 - 4);
          const nextGas = Math.min(250, Math.max(90, (prev.gasIndex ?? 140) + gasDelta));
          return {
            temperature: nextTemp,
            gasIndex: nextGas,
            timestamp: new Date().toISOString(),
          };
        });
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn("[DashboardService] Polling error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [deviceStatus.online]);

  // Periodic polling
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, APP_CONFIG.refreshIntervalMs);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Actuator controls
  const toggleLed = useCallback(async () => {
    const nextVal = !deviceStatus.led;
    setDeviceStatus((prev) => ({ ...prev, led: nextVal }));
    if (blynkService.isConfigured()) {
      await blynkService.updatePin("v2", nextVal ? 1 : 0);
    }
  }, [deviceStatus.led]);

  const toggleAerator = useCallback(async () => {
    const nextVal = !deviceStatus.aerator;
    setDeviceStatus((prev) => ({ ...prev, aerator: nextVal }));
    if (blynkService.isConfigured()) {
      await blynkService.updatePin("v3", nextVal ? 1 : 0);
    }
  }, [deviceStatus.aerator]);

  const toggleMode = useCallback(async () => {
    const nextMode = deviceStatus.mode === "iot" ? "manual" : "iot";
    setDeviceStatus((prev) => ({ ...prev, mode: nextMode }));
    if (blynkService.isConfigured()) {
      await blynkService.updatePin("v4", nextMode === "iot" ? 1 : 0);
    }
  }, [deviceStatus.mode]);

  const toggleOnline = useCallback(() => {
    setDeviceStatus((prev) => ({ ...prev, online: !prev.online }));
  }, []);

  return {
    sensorData,
    deviceStatus,
    diagnostics,
    carbonMetric,
    biomassMetric,
    telemetryHistory,
    timeRange,
    setTimeRange,
    lastUpdatedText,
    isRefreshing,
    isBlynkConfigured,
    toggleLed,
    toggleAerator,
    toggleMode,
    toggleOnline,
    refreshData,
  };
}
