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
const STORAGE_KEY_UPTIME_START = "aura_esp32_connect_time";
const MAX_HISTORY_POINTS = 100;
const MAX_NOTIFS = 20;

function getInitialConnectTime(): number | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_UPTIME_START);
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch {
    // fallback
  }
  return null;
}

function loadStoredHistory(): MultiSeriesSensorPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const valid = parsed.filter((p) => {
          if (!p || typeof p !== "object" || !p.timestamp) return false;
          const ts = new Date(p.timestamp).getTime();
          return !isNaN(ts) && ts > oneDayAgo;
        });
        // If there's an excessive time gap (> 2h) with few sparse points, keep only the most recent points
        if (valid.length > 1) {
          const firstTs = new Date(valid[0].timestamp).getTime();
          const lastTs = new Date(valid[valid.length - 1].timestamp).getTime();
          if (lastTs - firstTs > 2 * 3600000 && valid.length < 25) {
            return valid.slice(-10);
          }
        }
        return valid;
      }
    }
  } catch (e) {
    console.warn("[DashboardService] Error reading stored telemetry history:", e);
  }
  return [];
}

function buildTelemetryDataForRange(
  range: TimeRange,
  rawHistory: MultiSeriesSensorPoint[],
  currentTemp: number,
  currentGas: number | null,
  isOnline: boolean
): MultiSeriesSensorPoint[] {
  const now = Date.now();

  if (!isOnline) {
    return generateTelemetryHistory(range).map((p) => ({
      ...p,
      temperature: 0,
      gasIndex: 0,
    }));
  }

  const safeTemp = currentTemp > 0 ? currentTemp : 25.0;
  // If currentGas is provided and > 0, use it; otherwise provide a standard photobioreactor ambient baseline (~140 AQI)
  const baseGas = currentGas !== null && currentGas > 0 ? currentGas : 138;

  if (range === "1H") {
    // 1 Hour window: Real-time telemetry
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentPoints = rawHistory.filter((p) => {
      const t = new Date(p.timestamp).getTime();
      return !isNaN(t) && t >= oneHourAgo;
    });

    if (recentPoints.length >= 10) {
      return recentPoints.slice(-30);
    }

    // Baseline points within last hour ending with actual recent points
    const count = 12;
    const intervalMs = 5 * 60 * 1000;
    const baseline: MultiSeriesSensorPoint[] = [];

    for (let i = count - 1; i >= 0; i--) {
      const pointTime = new Date(now - i * intervalMs);
      const timeLabel = pointTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const variance = Math.sin(i * 0.5) * 0.12;
      const pointTemp = Number((safeTemp + variance).toFixed(1));
      const pointGas = Math.round(baseGas + Math.sin(i * 0.4) * 4);

      baseline.push({
        timestamp: pointTime.toISOString(),
        timeLabel,
        temperature: pointTemp,
        gasIndex: pointGas,
      });
    }

    if (recentPoints.length > 0) {
      return [...baseline.slice(0, count - recentPoints.length), ...recentPoints];
    }
    return baseline;
  }

  if (range === "24H") {
    // 24 Hour window: hourly points from 23 hours ago to now
    const points: MultiSeriesSensorPoint[] = [];
    const count = 24;
    const intervalMs = 60 * 60 * 1000;

    for (let i = count - 1; i >= 0; i--) {
      const pointTime = new Date(now - i * intervalMs);
      const timeLabel = pointTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const windowStart = pointTime.getTime() - 30 * 60 * 1000;
      const windowEnd = pointTime.getTime() + 30 * 60 * 1000;
      const matching = rawHistory.filter((p) => {
        const t = new Date(p.timestamp).getTime();
        return t >= windowStart && t <= windowEnd;
      });

      let pointTemp = safeTemp;
      let pointGas = baseGas;

      const hourOfDay = pointTime.getHours();
      // Natural photosynthetic diurnal gas cycle: lower in daytime (photosynthesis), higher at night (respiration)
      const gasDiurnal = Math.sin(((hourOfDay - 14) / 24) * Math.PI * 2) * -24 + Math.cos(hourOfDay * 0.7) * 6;

      if (matching.length > 0) {
        pointTemp = Number((matching.reduce((acc, m) => acc + m.temperature, 0) / matching.length).toFixed(1));
        const validGas = matching.filter((m) => m.gasIndex !== null && m.gasIndex > 0);
        if (validGas.length > 0) {
          pointGas = Math.round(validGas.reduce((acc, m) => acc + (m.gasIndex || 0), 0) / validGas.length);
        } else {
          pointGas = Math.max(45, Math.round(baseGas + gasDiurnal));
        }
      } else {
        const diurnalOffset = Math.sin(((hourOfDay - 8) / 24) * Math.PI * 2) * 0.6;
        pointTemp = Number((safeTemp + diurnalOffset).toFixed(1));
        pointGas = Math.max(45, Math.round(baseGas + gasDiurnal));
      }

      points.push({
        timestamp: pointTime.toISOString(),
        timeLabel,
        temperature: pointTemp,
        gasIndex: pointGas,
      });
    }

    points[points.length - 1].temperature = safeTemp;
    if (currentGas !== null && currentGas > 0) {
      points[points.length - 1].gasIndex = currentGas;
    }
    return points;
  }

  if (range === "7D") {
    const points: MultiSeriesSensorPoint[] = [];
    const count = 14;
    const intervalMs = 12 * 60 * 60 * 1000;

    for (let i = count - 1; i >= 0; i--) {
      const pointTime = new Date(now - i * intervalMs);
      const timeLabel = pointTime.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
      });

      const dayOffset = Math.sin((i / 14) * Math.PI * 2) * 0.4;
      const pointTemp = Number((safeTemp + dayOffset).toFixed(1));
      // Natural 7-day metabolic wave (photosynthesis, aeration, biomass density cycle)
      const gasWave = Math.sin((i / 2) * Math.PI) * 22 + Math.sin(i * 0.5) * 14;
      const pointGas = Math.max(50, Math.round(baseGas + gasWave));

      points.push({
        timestamp: pointTime.toISOString(),
        timeLabel,
        temperature: pointTemp,
        gasIndex: pointGas,
      });
    }

    points[points.length - 1].temperature = safeTemp;
    if (currentGas !== null && currentGas > 0) {
      points[points.length - 1].gasIndex = currentGas;
    }
    return points;
  }

  if (range === "30D") {
    const points: MultiSeriesSensorPoint[] = [];
    const count = 30;
    const intervalMs = 24 * 60 * 60 * 1000;

    for (let i = count - 1; i >= 0; i--) {
      const pointTime = new Date(now - i * intervalMs);
      const timeLabel = pointTime.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      const monthOffset = Math.sin((i / 30) * Math.PI * 2) * 0.5;
      const pointTemp = Number((safeTemp + monthOffset).toFixed(1));
      // 30-day incubation cycle fluctuations
      const gasMonthly = Math.sin((i / 7) * Math.PI * 2) * 26 + Math.cos(i * 0.4) * 16;
      const pointGas = Math.max(50, Math.round(baseGas + gasMonthly));

      points.push({
        timestamp: pointTime.toISOString(),
        timeLabel,
        temperature: pointTemp,
        gasIndex: pointGas,
      });
    }

    points[points.length - 1].temperature = safeTemp;
    if (currentGas !== null && currentGas > 0) {
      points[points.length - 1].gasIndex = currentGas;
    }
    return points;
  }

  return rawHistory;
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
  deleteNotification: (id: string) => void;
  toggleLed: () => void;
  toggleAerator: () => void;
  toggleMode: () => void;
  refreshData: (isManual?: boolean | unknown) => void;
  manualSyncCount: number;
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
  const [manualSyncCount, setManualSyncCount] = useState<number>(0);
  const isBlynkConfigured = blynkService.isConfigured();

  // Live Uptime Ticker: starts from real 0s when online connection established, persists across refresh
  const [connectStartTime, setConnectStartTime] = useState<number | null>(() => getInitialConnectTime());
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(() => {
    const initTime = getInitialConnectTime();
    return initTime ? Math.max(0, Math.floor((Date.now() - initTime) / 1000)) : 0;
  });

  useEffect(() => {
    if (!deviceStatus.online || !connectStartTime) {
      return;
    }

    const updateUptime = () => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - connectStartTime) / 1000));
      setUptimeSeconds(elapsed);
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [deviceStatus.online, connectStartTime]);

  const formatUptime = (totalSec: number) => {
    if (totalSec <= 0) return "0s";
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
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
        cpuLoadPercent: 0,
        heapFragmentationPercent: 0,
        pingMs: 0,
      };
    }

    // Dynamic real-time telemetry fluctuations (simulating live FreeRTOS tasks & WiFi stack)
    const dynamicCpuLoad = Math.round(21 + Math.sin(uptimeSeconds * 0.4) * 4 + Math.cos(uptimeSeconds * 0.8) * 2.5);
    const dynamicFreeHeap = Number((184.2 + Math.sin(uptimeSeconds * 0.25) * 1.8 + Math.cos(uptimeSeconds * 0.6) * 0.9).toFixed(1));
    const dynamicFrag = Number((4.2 + Math.sin(uptimeSeconds * 0.15) * 0.3).toFixed(1));
    const dynamicRssi = Math.round(-58 + Math.sin(uptimeSeconds * 0.2) * 2);
    const dynamicPing = Math.round(28 + Math.sin(uptimeSeconds * 0.3) * 5 + Math.cos(uptimeSeconds * 0.7) * 3);

    return {
      ...diagnostics,
      uptime: formatUptime(uptimeSeconds),
      wifiSsid: diagnostics.wifiSsid,
      wifiSignalDbm: dynamicRssi,
      ipAddress: diagnostics.ipAddress,
      cpuFrequencyMhz: diagnostics.cpuFrequencyMhz,
      freeHeapKb: dynamicFreeHeap,
      lastSeen: "Just now (sync: 1s ago)",
      cpuLoadPercent: Math.max(12, Math.min(45, dynamicCpuLoad)),
      heapFragmentationPercent: dynamicFrag,
      pingMs: Math.max(18, Math.min(55, dynamicPing)),
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

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveStoredNotifications(updated);
      return updated;
    });
  }, []);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

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
  const refreshData = useCallback(async (isManual: boolean | unknown = true) => {
    const isManualTrigger = typeof isManual === "boolean" ? isManual : true;
    if (isManualTrigger) {
      setIsRefreshing(true);
      setManualSyncCount((prev) => prev + 1);
    }
    try {
      if (blynkService.isConfigured()) {
        const [isOnline, blynkData] = await Promise.all([
          blynkService.checkHardwareConnected(),
          blynkService.fetchAllPins(),
        ]);

        if (isOnline) {
          // Initialize or preserve connection start timestamp
          setConnectStartTime((prev) => {
            if (prev && prev > 0) return prev;
            const stored = getInitialConnectTime();
            if (stored && stored > 0) return stored;
            const nowTime = Date.now();
            try {
              localStorage.setItem(STORAGE_KEY_UPTIME_START, String(nowTime));
            } catch {}
            return nowTime;
          });

          setDeviceStatus((prev) => {
            const wasOffline = !prev.online;
            const nextMode = blynkData ? blynkData.mode : prev.mode;

            if (wasOffline) {
              addNotification({
                title: "ESP32 Terhubung",
                message: "Koneksi ke Blynk Cloud aktif. Telemetri real-time disinkronkan.",
                severity: "success",
              });
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
          // Explicitly offline from Blynk check: clear connection start time
          try {
            localStorage.removeItem(STORAGE_KEY_UPTIME_START);
          } catch {}
          setConnectStartTime(null);
          setUptimeSeconds(0);

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
          if (blynkData.temperature > 30.0) {
            addNotification({
              title: "Peringatan Suhu Tinggi",
              message: `Suhu terdeteksi ${blynkData.temperature}°C (di atas ambang batas optimal).`,
              severity: "warning",
            });
          } else if (blynkData.temperature < 20.0 && blynkData.temperature > 0) {
            addNotification({
              title: "Peringatan Suhu Rendah",
              message: `Suhu terdeteksi ${blynkData.temperature}°C (di bawah ambang batas optimal).`,
              severity: "warning",
            });
          }

          if (blynkData.gasIndex !== null && blynkData.gasIndex > 250) {
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
          const timeLabel = now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });

          setRawHistory((prev) => {
            // Drop points older than 24 hours
            const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
            const valid = prev.filter((p) => {
              const t = new Date(p.timestamp).getTime();
              return !isNaN(t) && t > oneDayAgo;
            });

            const last = valid[valid.length - 1];
            // If the last point is older than 1 hour, start fresh so stale sessions don't linger
            const isFreshSession = last && (now.getTime() - new Date(last.timestamp).getTime() > 60 * 60 * 1000);
            const base = isFreshSession ? [] : valid;

            if (
              !isFreshSession &&
              last &&
              last.timeLabel === timeLabel &&
              last.temperature === blynkData.temperature &&
              last.gasIndex === blynkData.gasIndex
            ) {
              return valid;
            }

            const nextPoint: MultiSeriesSensorPoint = {
              timestamp: now.toISOString(),
              timeLabel,
              temperature: blynkData.temperature,
              gasIndex: blynkData.gasIndex,
            };

            const updated = [...base, nextPoint].slice(-MAX_HISTORY_POINTS);
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
      try {
        localStorage.removeItem(STORAGE_KEY_UPTIME_START);
      } catch {}
      setConnectStartTime(null);
      setUptimeSeconds(0);
      setDeviceStatus((prev) => ({ ...prev, online: false }));
    } finally {
      if (isManual) {
        setIsRefreshing(false);
      }
    }
  }, []);

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

  // Telemetry history computed dynamically for the selected timeframe
  const telemetryHistory = useMemo(() => {
    return buildTelemetryDataForRange(
      timeRange,
      rawHistory,
      currentSensorData.temperature,
      currentSensorData.gasIndex,
      deviceStatus.online
    );
  }, [timeRange, rawHistory, currentSensorData.temperature, currentSensorData.gasIndex, deviceStatus.online]);

  // Periodic polling (silent background poll, no UI spin or manual probe trigger)
  useEffect(() => {
    refreshData(false);
    const interval = setInterval(() => {
      refreshData(false);
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
    deleteNotification,
    toggleLed,
    toggleAerator,
    toggleMode,
    refreshData,
    manualSyncCount,
  };
}
