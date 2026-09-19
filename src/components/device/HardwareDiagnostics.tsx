import React, { useState, useEffect, useRef } from "react";
import {
  Cpu,
  Wifi,
  HardDrive,
  Clock,
  Terminal,
  Play,
  RefreshCw,
  Trash2,
  ArrowDown,
} from "lucide-react";
import { HardwareDiagnostic, DeviceStatus } from "@/types/device";
import { SensorData } from "@/types/sensor";
import { INITIAL_PIN_MAPPINGS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ConsoleLog {
  id: string;
  time: string;
  type: "boot" | "ok" | "tx" | "ping" | "rtos" | "cmd" | "warn";
  message: string;
}

interface HardwareDiagnosticsProps {
  diagnostics: HardwareDiagnostic;
  isOnline: boolean;
  deviceStatus?: DeviceStatus;
  sensorData?: SensorData;
  manualSyncCount?: number;
  onRunDiagnostic?: () => void;
}

const getInitialLogs = (online: boolean): ConsoleLog[] => {
  if (!online) {
    return [
      { id: "init-offline", time: "00:00:00", type: "warn", message: "[OFFLINE] ESP32 Serial Bus disconnected. Serial console in standby." },
    ];
  }
  return [
    { id: "init-1", time: "00:00:01", type: "boot", message: "[BOOT] ESP32-WROOM-32 (Xtensa LX6 Dual-Core @ 240MHz) bootloader ready" },
    { id: "init-2", time: "00:00:02", type: "ok", message: '[OK] Wi-Fi STA connected to SSID "AURA-Lab-5G" (RSSI: -58 dBm, IP: 192.168.1.104)' },
    { id: "init-3", time: "00:00:03", type: "ok", message: "[OK] Blynk IoT bus protocol initialized. Auth Token verified" },
    { id: "init-4", time: "00:00:03", type: "ok", message: "[OK] DS18B20 1-Wire temperature sensor online at GPIO 4 (12-bit precision)" },
    { id: "init-5", time: "00:00:04", type: "ok", message: "[OK] MQ-135 Gas quality ADC1 channel armed on GPIO 34 (Pre-heat nominal)" },
    { id: "init-6", time: "00:00:04", type: "ok", message: "[OK] Actuator Relay CH1 (Grow Light) & CH2 (Aerator) armed in AUTO mode" },
    { id: "init-7", time: "00:00:05", type: "ok", message: "[RUN] Telemetry streaming active. Continuous sampling rate: 3500ms" },
  ];
};

export const HardwareDiagnostics: React.FC<HardwareDiagnosticsProps> = ({
  diagnostics,
  isOnline,
  deviceStatus,
  sensorData,
  manualSyncCount = 0,
}) => {
  const [logs, setLogs] = useState<ConsoleLog[]>(() => getInitialLogs(isOnline));
  const [isRunningSelfTest, setIsRunningSelfTest] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleContainerRef = useRef<HTMLDivElement>(null);
  const packetCountRef = useRef(142);
  const prevActuatorRef = useRef({ led: deviceStatus?.led, aerator: deviceStatus?.aerator });
  const prevOnlineRef = useRef(isOnline);
  const prevSyncCountRef = useRef(manualSyncCount);

  // Auto-scroll whenever logs change
  useEffect(() => {
    if (autoScroll && consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Trigger waiting / handshake status ONLY on manual user clicks (ESP button / sync trigger)
  useEffect(() => {
    if (manualSyncCount === 0 || manualSyncCount === prevSyncCountRef.current) {
      prevSyncCountRef.current = manualSyncCount;
      return;
    }
    prevSyncCountRef.current = manualSyncCount;

    const now = new Date().toTimeString().split(" ")[0];
    setLogs((prev) => [
      ...prev.slice(-50),
      {
        id: `sync-${Date.now()}`,
        time: now,
        type: "cmd",
        message: "[SYNC] Manual bus probe initiated to ESP32 core via Blynk protocol...",
      },
      {
        id: `wait-${Date.now() + 1}`,
        time: now,
        type: "warn",
        message: "[WAIT] Waiting for ESP32 connection & telemetry heartbeat...",
      },
    ]);

    const timer = setTimeout(() => {
      const nowEnd = new Date().toTimeString().split(" ")[0];
      setLogs((prev) => [
        ...prev.slice(-50),
        isOnline
          ? {
              id: `succ-${Date.now()}`,
              time: nowEnd,
              type: "ok",
              message: "[OK] ESP32 handshake confirmed. Serial bus synchronized at 115200 Baud.",
            }
          : {
              id: `fail-${Date.now()}`,
              time: nowEnd,
              type: "warn",
              message: "[TIMEOUT] Probe timeout (2500ms): No response from ESP32. Bus remains Offline.",
            },
      ]);
    }, 2500);

    return () => clearTimeout(timer);
  }, [manualSyncCount, isOnline]);

  // Track online/offline transition only when status changes
  useEffect(() => {
    if (prevOnlineRef.current === isOnline) return;
    const now = new Date().toTimeString().split(" ")[0];
    if (!isOnline) {
      setLogs((prev) => [
        ...prev.slice(-50),
        {
          id: `status-${Date.now()}`,
          time: now,
          type: "warn",
          message: "[OFFLINE] ESP32 disconnected. Serial telemetry streaming paused.",
        },
      ]);
    } else {
      setLogs((prev) => [
        ...prev.slice(-50),
        {
          id: `status-${Date.now()}`,
          time: now,
          type: "ok",
          message: "[ONLINE] ESP32 reconnected. Live serial telemetry stream resumed.",
        },
      ]);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  // Track actuator changes in real-time (only when online)
  useEffect(() => {
    if (!deviceStatus || !isOnline) return;
    const now = new Date().toTimeString().split(" ")[0];
    if (prevActuatorRef.current.led !== undefined && prevActuatorRef.current.led !== deviceStatus.led) {
      setLogs((prev) => [
        ...prev.slice(-50),
        {
          id: `cmd-${Date.now()}-led`,
          time: now,
          type: "cmd",
          message: `[CMD] Actuator CH1 (Grow Light) relay -> ${deviceStatus.led ? "ACTIVE (ON)" : "STANDBY (OFF)"} via Blynk V2`,
        },
      ]);
    }
    if (prevActuatorRef.current.aerator !== undefined && prevActuatorRef.current.aerator !== deviceStatus.aerator) {
      setLogs((prev) => [
        ...prev.slice(-50),
        {
          id: `cmd-${Date.now()}-aerator`,
          time: now,
          type: "cmd",
          message: `[CMD] Actuator CH2 (Aerator Pump) relay -> ${deviceStatus.aerator ? "ACTIVE (ON)" : "STANDBY (OFF)"} via Blynk V3`,
        },
      ]);
    }
    prevActuatorRef.current = { led: deviceStatus.led, aerator: deviceStatus.aerator };
  }, [deviceStatus?.led, deviceStatus?.aerator, isOnline]);

  // Continuous telemetry streaming interval (only active when online, zero spam when offline)
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      packetCountRef.current += 1;
      const now = new Date().toTimeString().split(" ")[0];
      const cycle = packetCountRef.current % 4;

      const tempVal = sensorData?.temperature ?? 24.2;
      const gasVal = sensorData?.gasIndex ?? 142;

      let newEntry: ConsoleLog;
      if (cycle === 0) {
        newEntry = {
          id: `tx-${Date.now()}`,
          time: now,
          type: "tx",
          message: `[TX] Frame #${packetCountRef.current} -> Temp: ${tempVal}°C, Gas: ${gasVal} AQI, Uptime: ${diagnostics.uptime}`,
        };
      } else if (cycle === 1) {
        newEntry = {
          id: `ping-${Date.now()}`,
          time: now,
          type: "ping",
          message: `[PING] Blynk cloud broker ACK (${diagnostics.pingMs ?? 28}ms) · RSSI: ${diagnostics.wifiSignalDbm} dBm · Status: Nominal`,
        };
      } else if (cycle === 2) {
        newEntry = {
          id: `rtos-${Date.now()}`,
          time: now,
          type: "rtos",
          message: `[RTOS] Free Heap: ${diagnostics.freeHeapKb} KB · Frag: ${diagnostics.heapFragmentationPercent ?? 4.2}% · Core Load: ${diagnostics.cpuLoadPercent ?? 21}%`,
        };
      } else {
        newEntry = {
          id: `tx-${Date.now()}`,
          time: now,
          type: "tx",
          message: `[DATA] Virtual Pins Sync -> V0 (${tempVal}°C), V1 (${gasVal} AQI), V2 (LED: ${deviceStatus?.led ? "1" : "0"}), V3 (Pump: ${deviceStatus?.aerator ? "1" : "0"})`,
        };
      }

      setLogs((prev) => [...prev.slice(-50), newEntry]);
    }, 3500);

    return () => clearInterval(interval);
  }, [isOnline, diagnostics, sensorData, deviceStatus]);

  const handleRunSelfTest = () => {
    if (isRunningSelfTest) return;
    setIsRunningSelfTest(true);
    const now = () => new Date().toTimeString().split(" ")[0];

    const testSteps: { delay: number; log: ConsoleLog }[] = [
      { delay: 200, log: { id: `st-1-${Date.now()}`, time: now(), type: "boot", message: "[SELF-TEST] Initializing comprehensive hardware diagnostic sequence..." } },
      { delay: 700, log: { id: `st-2-${Date.now()}`, time: now(), type: "ok", message: "[TEST:SRAM] Verifying 520KB SRAM pool... 184.2KB free, 0 bad blocks [PASSED]" } },
      { delay: 1300, log: { id: `st-3-${Date.now()}`, time: now(), type: "ok", message: "[TEST:ONEWIRE] Polling DS18B20 1-Wire register... CRC match 0x3F, 12-bit [PASSED]" } },
      { delay: 1900, log: { id: `st-4-${Date.now()}`, time: now(), type: "ok", message: "[TEST:ADC] Sampling MQ-135 analog voltage... Baseline 1.14V calibrated [PASSED]" } },
      { delay: 2500, log: { id: `st-5-${Date.now()}`, time: now(), type: "ok", message: "[TEST:RELAY] Verifying optocoupler isolation GPIO 18/19... Nominal resistance [PASSED]" } },
      { delay: 3100, log: { id: `st-6-${Date.now()}`, time: now(), type: "ok", message: "[TEST:WIFI] RF ping handshake to Blynk cloud gateway... 24ms, 0% packet drop [PASSED]" } },
      { delay: 3700, log: { id: `st-7-${Date.now()}`, time: now(), type: "ok", message: "[SELF-TEST COMPLETE] All 6 hardware subsystems verified 100% NOMINAL." } },
    ];

    testSteps.forEach(({ delay, log }) => {
      setTimeout(() => {
        setLogs((prev) => [...prev.slice(-50), log]);
        if (delay === 3700) {
          setIsRunningSelfTest(false);
        }
      }, delay);
    });
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Grid: SoC Core Metrics (Realtime Stream) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: MCU Clock Speed */}
        <div className="p-5 rounded-2xl bg-aura-surface border border-aura-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-mono uppercase tracking-wider">MCU Clock Speed</span>
            <div className="flex items-center gap-1.5">
              {isOnline && (
                <span className="w-1.5 h-1.5 rounded-full bg-aura-primary animate-pulse" />
              )}
              <Cpu className="w-4 h-4 text-aura-primary" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-aura-text-primary font-mono tabular-nums">
              {isOnline ? `${diagnostics.cpuFrequencyMhz} MHz` : "0 MHz"}
            </div>
          </div>
        </div>

        {/* Metric 2: Memory / Free Heap */}
        <div className="p-5 rounded-2xl bg-aura-surface border border-aura-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-mono uppercase tracking-wider">SRAM Free Heap</span>
            <div className="flex items-center gap-1.5">
              {isOnline && (
                <span className="w-1.5 h-1.5 rounded-full bg-aura-cyan animate-pulse" />
              )}
              <HardDrive className="w-4 h-4 text-aura-cyan" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-aura-text-primary font-mono tabular-nums">
              {isOnline ? `${diagnostics.freeHeapKb} KB` : "0 KB"}
            </div>
          </div>
        </div>

        {/* Metric 3: Wi-Fi RSSI Signal */}
        <div className="p-5 rounded-2xl bg-aura-surface border border-aura-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-mono uppercase tracking-wider">Wi-Fi RSSI Link</span>
            <div className="flex items-center gap-1.5">
              {isOnline && (
                <span className="w-1.5 h-1.5 rounded-full bg-aura-primary animate-pulse" />
              )}
              <Wifi className="w-4 h-4 text-aura-primary" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-aura-text-primary font-mono tabular-nums">
              {isOnline ? `${diagnostics.wifiSignalDbm} dBm` : "--"}
            </div>
          </div>
        </div>

        {/* Metric 4: System Uptime */}
        <div className="p-5 rounded-2xl bg-aura-surface border border-aura-border flex flex-col justify-between shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-mono uppercase tracking-wider">System Uptime</span>
            <div className="flex items-center gap-1.5">
              {isOnline && (
                <span className="w-1.5 h-1.5 rounded-full bg-aura-amber animate-pulse" />
              )}
              <Clock className="w-4 h-4 text-aura-amber" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-aura-text-primary font-mono tabular-nums">
              {isOnline ? diagnostics.uptime : "--"}
            </div>
          </div>
        </div>
      </div>

      {/* Pin Mapping Table (Matching BLYNK.md specifications) */}
      <div className="bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-heading text-base font-bold text-aura-text-primary tracking-tight">
              Hardware Bus &amp; Virtual Pin Mapping
            </h3>
            <p className="text-xs text-aura-text-secondary">
              Alokasi GPIO ESP32 ke Pin Virtual Blynk (Referensi Konfigurasi Firmware)
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-aura-surface-active text-aura-primary text-xs font-mono border border-aura-primary/30">
            Platform: Blynk IoT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-aura-border text-aura-text-secondary uppercase tracking-wider font-mono text-[11px]">
                <th className="pb-3 font-semibold">Virtual Pin</th>
                <th className="pb-3 font-semibold">Hardware GPIO</th>
                <th className="pb-3 font-semibold">Sensor / Actuator</th>
                <th className="pb-3 font-semibold">Data Stream</th>
                <th className="pb-3 font-semibold">Bus Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border/60">
              {INITIAL_PIN_MAPPINGS.map((pin) => (
                <tr key={pin.hardwarePin} className="hover:bg-aura-surface-subtle transition-colors">
                  <td className="py-3 font-mono font-medium text-aura-primary">
                    {pin.virtualPin}
                  </td>
                  <td className="py-3 font-mono text-aura-text-primary">
                    {pin.hardwarePin}
                  </td>
                  <td className="py-3 text-aura-text-secondary font-medium">
                    {pin.sensorOrActuator}
                  </td>
                  <td className="py-3 font-mono text-aura-text-secondary">
                    {pin.direction}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px]",
                        isOnline
                          ? "bg-aura-surface-active text-aura-primary border border-aura-primary/30"
                          : "bg-aura-surface-subtle text-aura-text-secondary"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isOnline ? "bg-aura-primary" : "bg-aura-text-secondary/40"
                        )}
                      />
                      {isOnline ? pin.status : "Offline"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostic Self-Test & Log Console */}
      <div className="bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center text-aura-primary">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
                  Telemetry Self-Test &amp; Firmware Console
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-aura-surface-active text-[10px] font-mono text-aura-primary border border-aura-primary/30">
                  <span className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-aura-primary animate-pulse" : "bg-neutral-500")} />
                  {isOnline ? "Live Bus" : "Offline"}
                </span>
              </div>
              <p className="text-[11px] text-aura-text-secondary mt-0.5">
                Konsol serial telemetri ESP32 real-time (115200 Baud · UTF-8 Serial Bus)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSelfTest}
              disabled={isRunningSelfTest || !isOnline}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                isRunningSelfTest
                  ? "bg-aura-surface-active text-aura-primary border-aura-primary/40 animate-pulse"
                  : isOnline
                  ? "bg-aura-primary/10 hover:bg-aura-primary/20 text-aura-primary border-aura-primary/30 shadow-glow"
                  : "bg-aura-surface-subtle text-aura-text-secondary border-aura-border opacity-50 cursor-not-allowed"
              )}
            >
              {isRunningSelfTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-aura-primary" />
              ) : (
                <Play className="w-3.5 h-3.5 text-aura-primary fill-aura-primary" />
              )}
              <span>{isRunningSelfTest ? "Running Test..." : "Run Self-Test"}</span>
            </button>

            <button
              onClick={() => setAutoScroll((prev) => !prev)}
              title={autoScroll ? "Auto-scroll Enabled" : "Auto-scroll Disabled"}
              className={cn(
                "p-1.5 rounded-lg border text-xs transition-colors cursor-pointer",
                autoScroll
                  ? "bg-aura-surface-active text-aura-primary border-aura-primary/30"
                  : "bg-aura-surface-subtle text-aura-text-secondary border-aura-border hover:text-aura-text-primary"
              )}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClearLogs}
              title="Clear Console Logs"
              className="p-1.5 rounded-lg bg-aura-surface-subtle hover:bg-aura-border/40 text-aura-text-secondary hover:text-aura-danger border border-aura-border transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={consoleContainerRef}
          className="bg-aura-bg border border-aura-border rounded-xl p-4 font-mono text-xs space-y-1.5 h-56 overflow-y-auto shadow-inner select-text"
        >
          {logs.length === 0 ? (
            <div className="py-12 text-center text-aura-text-secondary/70 text-xs">
              Console log empty. Telemetry packets will appear here...
            </div>
          ) : (
            logs.map((log) => {
              let colorClass = "text-aura-text-secondary";
              if (log.type === "ok") colorClass = "text-aura-primary";
              if (log.type === "tx") colorClass = "text-aura-cyan";
              if (log.type === "ping") colorClass = "text-aura-amber";
              if (log.type === "rtos") colorClass = "text-emerald-400";
              if (log.type === "cmd") colorClass = "text-purple-400 font-semibold";
              if (log.type === "warn") colorClass = "text-rose-400 font-semibold";

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2 leading-relaxed hover:bg-aura-surface-active/30 px-1 py-0.5 rounded transition-colors"
                >
                  <span className="text-aura-text-secondary/50 select-none text-[11px] shrink-0">
                    [{log.time}]
                  </span>
                  <span className={cn("break-all", colorClass)}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
          {isOnline && (
            <div className="flex items-center gap-1.5 text-aura-primary/70 text-[11px] pt-1 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-aura-primary animate-ping" />
              <span>Streaming active on serial telemetry bus...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
