import { useState, useEffect, useCallback, useMemo } from "react";
import { SensorData, MultiSeriesSensorPoint, TimeRange } from "@/types/sensor";
import { DeviceStatus, HardwareDiagnostic } from "@/types/device";
import { CarbonMetric, BiomassMetric } from "@/types/mrv";
import { SystemNotification } from "@/types/notification";
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

const STORAGE_KEY_HISTORY = "aura_pod_telemetry_history";
const STORAGE_KEY_NOTIFS = "aura_pod_notifications";
const MAX_HISTORY_POINTS = 100;
const MAX_NOTIFS = 20;

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

function loadStoredNotifications(): SystemNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("[DashboardService] Error reading notifications:", e);
  }
  return [
    {
      id: "init-welcome",
      title: "Sistem Siap",
      message: "AURA Pod Dashboard aktif dan terhubung ke Blynk Cloud API.",
      severity: "info",
      timestamp: new Date().toISOString(),
      read: false,
    },
  ];
}

function saveStoredNotifications(notifs: SystemNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifs.slice(0, MAX_NOTIFS)));
  } catch (e) {
    console.warn("[DashboardService] Error persisting notifications:", e);
  }
}

export interface DashboardContextType {
  sensorData: SensorData;
  deviceStatus: DeviceStatus;
  diagnostics: HardwareDiagnostic;
  carbonMetric: CarbonMetric;
  biomassMetric: BiomassMetric;
  telemetryHistory: MultiSeriesSensorPoint[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  lastUpdatedText: string;
  isRefreshing: boolean;
  isBlynkConfigured: boolean;
  notifications: SystemNotification[];
  unreadNotificationCount: number;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
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
  const [timeRange, setTimeRange] = useState<TimeRange>("1H");
  const [rawHistory, setRawHistory] = useState<MultiSeriesSensorPoint[]>(() => {
    const stored = loadStoredHistory();
    if (stored.length > 0) return stored;
    return generateTelemetryHistory("1H");
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [lastUpdatedText, setLastUpdatedText] = useState<string>("Menghubungkan ke ESP32...");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const isBlynkConfigured = blynkService.isConfigured();

  // Live Uptime Ticker (Realtime seconds counter when online)
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(() => 412320);

  useEffect(() => {
    if (!deviceStatus.online) return;
    const interval = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [deviceStatus.online]);

  const formatUptime = (totalSec: number) => {
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const currentDiagnostics: HardwareDiagnostic = useMemo(() => {
    if (!deviceStatus.online) {
      return {
        ...diagnostics,
        uptime: "--",
        wifiSsid: "Disconnected",
        wifiSignalDbm: 0,
        ipAddress: "--",
        cpuFrequencyMhz: 0,
        freeHeapKb: 0,
        lastSeen: "Offline",
      };
    }
    return {
      ...diagnostics,
      uptime: formatUptime(uptimeSeconds),
      wifiSsid: diagnostics.wifiSsid,
      wifiSignalDbm: diagnostics.wifiSignalDbm,
      ipAddress: diagnostics.ipAddress,
      cpuFrequencyMhz: diagnostics.cpuFrequencyMhz,
      freeHeapKb: diagnostics.freeHeapKb,
      lastSeen: "Just now (sync: 2s ago)",
    };
  }, [deviceStatus.online, diagnostics, uptimeSeconds]);

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => loadStoredNotifications());

  const addNotification = useCallback((notif: Omit<SystemNotification, "id" | "timestamp" | "read">) => {
    const newNotif: SystemNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      const recent = prev[0];
      if (recent && recent.title === notif.title && Date.now() - new Date(recent.timestamp).getTime() < 60000) {
        return prev;
      }
      const updated = [newNotif, ...prev].slice(0, MAX_NOTIFS);
      saveStoredNotifications(updated);
      return updated;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveStoredNotifications(updated);
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveStoredNotifications([]);
  }, []);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // If no stored history yet, update 0-point baseline whenever timeframe changes
  useEffect(() => {
    const stored = loadStoredHistory();
    if (stored.length === 0) {
      setRawHistory(generateTelemetryHistory(timeRange));
    }
  }, [timeRange]);

  // Relative time counter
  useEffect(() => {
    const timer = setInterval(() => {
      if (!deviceStatus.online) {
        setLastUpdatedText("Perangkat Terputus (Offline)");
        return;
      }
      const diffSec = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
      if (diffSec < 5) {
        setLastUpdatedText("Baru saja");
      } else if (diffSec < 60) {
        setLastUpdatedText(`${diffSec} detik lalu`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setLastUpdatedText(`${diffMin} menit lalu`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deviceStatus.online, lastSyncTime]);

  // Live Sync with Blynk Cloud REST API (V0 - V4)
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (blynkService.isConfigured()) {
        const [isOnline, blynkData] = await Promise.all([
          blynkService.checkHardwareConnected(),
          blynkService.fetchAllPins(),
        ]);

        if (isOnline) {
          setDeviceStatus((prev) => {
            const wasOffline = !prev.online;
            const nextMode = wasOffline ? "iot" : (blynkData ? blynkData.mode : prev.mode);

            if (wasOffline) {
              addNotification({
                title: "ESP32 Terhubung",
                message: "Koneksi ke Blynk Cloud aktif. Mode IoT diaktifkan otomatis.",
                severity: "success",
              });
              blynkService.updatePin("v4", 1).catch(() => {});
            }

            return {
              ...prev,
              online: true,
              led: blynkData ? blynkData.led : prev.led,
              aerator: blynkData ? blynkData.aerator : prev.aerator,
              mode: nextMode,
            };
          });
        } else {
          setDeviceStatus((prev) => {
            if (prev.online) {
              addNotification({
                title: "ESP32 Terputus",
                message: "Hardware offline. Seluruh aktuator dimatikan total untuk keamanan kultur.",
                severity: "error",
              });
            }
            return {
              ...prev,
              online: false,
              led: false,
              aerator: false,
              mode: "iot",
            };
          });
        }

        if (blynkData && isOnline) {
          // Check sensor telemetry thresholds
          if (blynkData.temperature > 27.5) {
            addNotification({
              title: "Peringatan Suhu Tinggi",
              message: `Suhu terdeteksi ${blynkData.temperature}°C (di atas ambang batas optimal 22-26°C).`,
              severity: "warning",
            });
          } else if (blynkData.temperature < 20.0 && blynkData.temperature > 0) {
            addNotification({
              title: "Peringatan Suhu Rendah",
              message: `Suhu terdeteksi ${blynkData.temperature}°C (di bawah ambang batas optimal 22-26°C).`,
              severity: "warning",
            });
          }

          if (blynkData.gasIndex !== null && blynkData.gasIndex > 220) {
            addNotification({
              title: "Indeks Gas Meningkat",
              message: `MQ-135 mencatat ${blynkData.gasIndex} AQI. Dianjurkan menyalakan aerator.`,
              severity: "warning",
            });
          }

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
            const hasReal = prev.some((p) => p.temperature > 0 || (p.gasIndex !== null && p.gasIndex > 0));
            const updated = hasReal
              ? [...prev, nextPoint].slice(-MAX_HISTORY_POINTS)
              : [...prev.slice(1), nextPoint];
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

  // Telemetry history with flat 0 when offline or live rolling stream when online
  const telemetryHistory = useMemo(() => {
    if (!deviceStatus.online) {
      return generateTelemetryHistory(timeRange).map((p) => ({
        ...p,
        temperature: 0,
        gasIndex: 0,
      }));
    }
    if (rawHistory.length === 0) return generateTelemetryHistory(timeRange);
    return rawHistory;
  }, [deviceStatus.online, rawHistory, timeRange]);

  const currentSensorData: SensorData = useMemo(() => {
    if (!deviceStatus.online) {
      return {
        temperature: 0,
        gasIndex: null,
        timestamp: new Date().toISOString(),
      };
    }
    return sensorData;
  }, [deviceStatus.online, sensorData]);

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
    const nextMode = deviceStatus.mode === "manual" ? "iot" : "manual";
    setDeviceStatus((prev) => ({ ...prev, mode: nextMode }));
    if (blynkService.isConfigured()) {
      await blynkService.updatePin("v4", nextMode === "iot" ? 1 : 0);
    }
  }, [deviceStatus.mode]);

  return {
    sensorData: currentSensorData,
    deviceStatus,
    diagnostics: currentDiagnostics,
    carbonMetric,
    biomassMetric,
    telemetryHistory,
    timeRange,
    setTimeRange,
    lastUpdatedText,
    isRefreshing,
    isBlynkConfigured,
    notifications,
    unreadNotificationCount,
    markAllNotificationsAsRead,
    clearAllNotifications,
    toggleLed,
    toggleAerator,
    toggleMode,
    refreshData,
  };
}
