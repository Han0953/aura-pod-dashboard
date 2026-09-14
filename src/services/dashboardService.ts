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
  toggleLed: () => void;
  toggleAerator: () => void;
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

  // Periodic subtle sensor drift (live simulation)
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSensorData((prev) => {
        // Only update if online
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
      setIsRefreshing(false);
    }, 300);
  }, [deviceStatus.online]);

  // Background polling simulation
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, APP_CONFIG.refreshIntervalMs);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Actuator controls
  const toggleLed = useCallback(() => {
    setDeviceStatus((prev) => ({ ...prev, led: !prev.led }));
  }, []);

  const toggleAerator = useCallback(() => {
    setDeviceStatus((prev) => ({ ...prev, aerator: !prev.aerator }));
  }, []);

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
    toggleLed,
    toggleAerator,
    toggleOnline,
    refreshData,
  };
}
