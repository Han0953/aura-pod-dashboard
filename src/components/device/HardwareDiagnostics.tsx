import React from "react";
import {
  Cpu,
  Wifi,
  HardDrive,
  Clock,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { HardwareDiagnostic } from "@/types/device";
import { INITIAL_PIN_MAPPINGS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface HardwareDiagnosticsProps {
  diagnostics: HardwareDiagnostic;
  isOnline: boolean;
  onRunDiagnostic?: () => void;
}

export const HardwareDiagnostics: React.FC<HardwareDiagnosticsProps> = ({
  diagnostics,
  isOnline,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Grid: SoC Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: SoC & Clock */}
        <div className="p-4 rounded-xl bg-aura-surface border border-aura-border flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-mono uppercase">MCU Clock Speed</span>
            <Cpu className="w-4 h-4 text-aura-primary" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-aura-text-primary font-mono tabular-nums">
              {isOnline ? `${diagnostics.cpuFrequencyMhz} MHz` : "0 MHz"}
            </div>
            <div className="text-[11px] text-aura-text-secondary">
              Xtensa Dual-Core LX6
            </div>
          </div>
          <div className="text-[11px] text-aura-primary font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Clock Frequency Nominal</span>
          </div>
        </div>

        {/* Metric 2: Memory / Free Heap */}
        <div className="p-4 rounded-xl bg-aura-surface border border-aura-border flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-mono uppercase">SRAM Free Heap</span>
            <HardDrive className="w-4 h-4 text-aura-cyan" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-aura-text-primary font-mono tabular-nums">
              {isOnline ? `${diagnostics.freeHeapKb} KB` : "0 KB"}
            </div>
            <div className="text-[11px] text-aura-text-secondary">
              Heap Fragmentation: 4.2%
            </div>
          </div>
          <div className="text-[11px] text-aura-cyan font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Memory Safe Corridor</span>
          </div>
        </div>

        {/* Metric 3: Wi-Fi RSSI Signal */}
        <div className="p-4 rounded-xl bg-aura-surface border border-aura-border flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-mono uppercase">Wi-Fi RSSI Link</span>
            <Wifi className="w-4 h-4 text-aura-primary" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-aura-text-primary font-mono tabular-nums">
                {isOnline ? `${diagnostics.wifiSignalDbm} dBm` : "--"}
              </span>
              <span className="text-xs text-aura-primary font-semibold">
                {isOnline ? "Excellent" : "No Link"}
              </span>
            </div>
            <div className="text-[11px] text-aura-text-secondary truncate">
              SSID: {diagnostics.wifiSsid}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-aura-text-secondary">
            <span>IP: {isOnline ? diagnostics.ipAddress : "--"}</span>
          </div>
        </div>

        {/* Metric 4: System Uptime */}
        <div className="p-4 rounded-xl bg-aura-surface border border-aura-border flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-mono uppercase">System Uptime</span>
            <Clock className="w-4 h-4 text-aura-amber" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-aura-text-primary font-mono tabular-nums">
              {isOnline ? diagnostics.uptime : "0h 00m"}
            </div>
            <div className="text-[11px] text-aura-text-secondary">
              Zero watchdog resets
            </div>
          </div>
          <div className="text-[11px] text-aura-text-secondary font-mono">
            {diagnostics.lastSeen}
          </div>
        </div>
      </div>

      {/* Pin Mapping Table (Matching BLYNK.md specifications) */}
      <div className="bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-heading text-base font-bold text-aura-text-primary tracking-tight">
              Hardware Bus & Virtual Pin Mapping
            </h3>
            <p className="text-xs text-aura-text-secondary">
              ESP32 GPIO allocation to Blynk Virtual Pins (Firmware Config Reference)
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-aura-primary" />
            <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
              Telemetry Self-Test & Firmware Console
            </h3>
          </div>
          <span className="text-[11px] font-mono text-aura-text-secondary">
            Baud Rate: 115200
          </span>
        </div>

        <div className="bg-aura-surface-subtle border border-aura-border rounded-xl p-4 font-mono text-xs text-aura-text-secondary space-y-1.5 max-h-48 overflow-y-auto">
          <div className="text-aura-text-secondary/80">[BOOT] ESP32-WROOM-32 booting from flash...</div>
          <div className="text-aura-primary">[OK] Wi-Fi connected to SSID "AlgaLab-IoT-5G" (RSSI: -58 dBm)</div>
          <div className="text-aura-primary">[OK] Blynk IoT Protocol initialized. Auth Token verified.</div>
          <div className="text-aura-cyan">[OK] DS18B20 1-Wire bus detected at GPIO 4. Initial read: 24.2 °C</div>
          <div className="text-aura-cyan">[OK] PH-4502C ADC1 sampled at GPIO 34. Raw ADC: 2154. pH: 7.82</div>
          <div className="text-aura-amber">[OK] MQ-135 pre-heat cycle stable. Gas Index baseline: 142</div>
          <div className="text-aura-primary">[OK] Actuator Relay 1 (Grow Light) state: ON</div>
          <div className="text-aura-primary">[OK] Actuator Relay 2 (Aerator) state: ON</div>
          <div className="text-aura-text-primary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-aura-primary animate-pulse" />
            <span>[RUN] Telemetry stream active. Push interval: 5000ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
