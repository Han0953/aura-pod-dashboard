import { useState, useEffect, useCallback, useMemo } from "react";
import { SensorData, MultiSeriesSensorPoint } from "@/types/sensor";
import { DeviceStatus, HardwareDiagnostic } from "@/types/device";
import { CarbonMetric, BiomassMetric } from "@/types/mrv";
import {
  INITIAL_SENSOR_DATA,
  INITIAL_DEVICE_STATUS,
  MOCK_HARDWARE_DIAGNOSTICS,
  MOCK_CARBON_METRIC,
  MOCK_BIOMASS_METRIC,
} from "@/data/mockData";
import { APP_CONFIG } from "@/lib/constants";
import { blynkService } from "./blynkService";

const STORAGE_KEY_HISTORY = "aura_pod_telemetry_history";
const MAX_HISTORY_POINTS = 100;

function loadStoredHistory(): MultiSeriesSensorPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[DashboardService] Error reading stored telemetry history:", e);
  }
  return [];
}

function saveStoredHistory(points: MultiSeriesSensorPoint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(points.slice(-MAX_HISTORY_POINTS)));
  } catch (e) {
    console.warn("[DashboardService] Error persisting telemetry history:", e);
  }
}

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
  refreshData: () => void;
}

export function useDashboardData(): DashboardContextType {
  const [sensorData, setSensorData] = useState<SensorData>(INITIAL_SENSOR_DATA);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>(INITIAL_DEVICE_STATUS);
  const [diagnostics] = useState<HardwareDiagnostic>(MOCK_HARDWARE_DIAGNOSTICS);
  const [carbonMetric] = useState<CarbonMetric>(MOCK_CARBON_METRIC);
  const [biomassMetric] = useState<BiomassMetric>(MOCK_BIOMASS_METRIC);
  const [timeRange, setTimeRange] = useState<"1H" | "6H" | "24H" | "7D">("1H");
  const [rawHistory, setRawHistory] = useState<MultiSeriesSensorPoint[]>(() => loadStoredHistory());
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [lastUpdatedText, setLastUpdatedText] = useState<string>("Connecting to ESP32...");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const isBlynkConfigured = blynkService.isConfigured();

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

        if (blynkData && isOnline) {
          setSensorData({
            temperature: blynkData.temperature,
            gasIndex: blynkData.gasIndex,
            timestamp: new Date().toISOString(),
          });

          const now = new Date();
          const timeLabel = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });

          setRawHistory((prev) => {
            const last = prev[prev.length - 1];
            if (
              last &&
              last.timeLabel === timeLabel &&
              last.temperature === blynkData.temperature &&
              last.gasIndex === blynkData.gasIndex
            ) {
              return prev;
            }

            const nextPoint: MultiSeriesSensorPoint = {
              timestamp: now.toISOString(),
              timeLabel,
              temperature: blynkData.temperature,
              gasIndex: blynkData.gasIndex,
            };
            const updated = [...prev, nextPoint].slice(-MAX_HISTORY_POINTS);
            saveStoredHistory(updated);
            return updated;
          });
        }
        setLastSyncTime(new Date());
      } else {
        // Not configured -> offline, do not generate fake numbers
        setDeviceStatus((prev) => ({ ...prev, online: false }));
      }
    } catch (err) {
      console.warn("[DashboardService] Blynk polling error:", err);
      setDeviceStatus((prev) => ({ ...prev, online: false }));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Filter telemetry history by selected timeframe window
  const telemetryHistory = useMemo(() => {
    if (rawHistory.length === 0) return [];
    const now = Date.now();
    let windowMs = 60 * 60 * 1000; // 1H
    if (timeRange === "6H") windowMs = 6 * 60 * 60 * 1000;
    else if (timeRange === "24H") windowMs = 24 * 60 * 60 * 1000;
    else if (timeRange === "7D") windowMs = 7 * 24 * 60 * 60 * 1000;

    const cutoff = now - windowMs;
    const filtered = rawHistory.filter((pt) => {
      const ptTime = new Date(pt.timestamp).getTime();
      return !isNaN(ptTime) && ptTime >= cutoff;
    });

    // If recording just started and filtered items are few, show available real points
    return filtered.length > 0 ? filtered : rawHistory;
  }, [rawHistory, timeRange]);

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
    refreshData,
  };
}
