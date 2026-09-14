import React from "react";
import {
  Cpu,
  Lightbulb,
  Fan,
  Wind,
  Thermometer,
  ArrowRight,
} from "lucide-react";
import { DeviceStatus } from "@/types/device";
import { cn } from "@/lib/utils";

interface DeviceStatusCardProps {
  deviceStatus: DeviceStatus;
  onNavigateToDevice?: () => void;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({
  deviceStatus,
  onNavigateToDevice,
}) => {
  const hardwareUnits = [
    {
      name: "ESP32 Core",
      detail: "WROOM-32D Dual-Core SoC",
      icon: <Cpu className="w-4 h-4 text-aura-primary" />,
      status: deviceStatus.online ? "Online" : "Offline",
      statusColor: deviceStatus.online ? "text-aura-primary bg-aura-surface-active" : "text-red-500 bg-red-500/10",
      isPulse: deviceStatus.online,
    },
    {
      name: "LED Grow Light",
      detail: "Full Spectrum 660/450nm",
      icon: <Lightbulb className="w-4 h-4 text-aura-primary" />,
      status: deviceStatus.led ? "ON" : "OFF",
      statusColor: deviceStatus.led ? "text-aura-primary bg-aura-primary/10 font-bold" : "text-aura-text-secondary bg-aura-surface-subtle",
      isPulse: false,
    },
    {
      name: "Aerator Pump",
      detail: "Micro-bubble Venturi",
      icon: <Fan className="w-4 h-4 text-aura-primary" />,
      status: deviceStatus.aerator ? "ON" : "OFF",
      statusColor: deviceStatus.aerator ? "text-aura-primary bg-aura-primary/10 font-bold" : "text-aura-text-secondary bg-aura-surface-subtle",
      isPulse: false,
    },
    {
      name: "MQ-135 Sensor",
      detail: "Gas Quality & Air Index",
      icon: <Wind className="w-4 h-4 text-aura-amber" />,
      status: deviceStatus.online ? "Active" : "Standby",
      statusColor: "text-aura-amber bg-aura-amber/10",
      isPulse: false,
    },
    {
      name: "DS18B20 Sensor",
      detail: "Waterproof Temp Probe",
      icon: <Thermometer className="w-4 h-4 text-aura-primary" />,
      status: deviceStatus.online ? "Active" : "Standby",
      statusColor: "text-aura-primary bg-aura-surface-active",
      isPulse: false,
    },
  ];

  const activeCount = hardwareUnits.filter(
    (u) => u.status !== "Offline" && u.status !== "Disconnected"
  ).length;

  return (
    <div className="flex flex-col bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center text-aura-primary">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="font-heading text-base font-bold text-aura-text-primary tracking-tight">
              Device Status
            </h2>
          </div>

          {onNavigateToDevice && (
            <button
              onClick={onNavigateToDevice}
              className="text-xs text-aura-primary hover:text-aura-primary-hover flex items-center gap-1 group transition-colors"
            >
              <span>View Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        <p className="text-xs text-aura-text-secondary mb-4">
          Hardware components and sensor modules status
        </p>

        {/* Modules List */}
        <div className="flex flex-col gap-2">
          {hardwareUnits.map((unit) => (
            <div
              key={unit.name}
              className="flex items-center justify-between p-2.5 rounded-xl bg-aura-surface-subtle border border-aura-border/60 hover:border-aura-border transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-aura-surface border border-aura-border">
                  {unit.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-aura-text-primary">
                    {unit.name}
                  </span>
                  <span className="text-[10px] text-aura-text-secondary font-mono">
                    {unit.detail}
                  </span>
                </div>
              </div>

              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono",
                  unit.statusColor
                )}
              >
                {unit.isPulse && (
                  <span className="w-1.5 h-1.5 rounded-full bg-aura-primary animate-ping" />
                )}
                {unit.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Health Summary */}
      <div className="mt-4 pt-3 border-t border-aura-border flex items-center justify-between text-xs text-aura-text-secondary">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-aura-primary" />
          <span>
            <strong className="text-aura-text-primary font-mono">{activeCount}/{hardwareUnits.length}</strong> Units Nominal
          </span>
        </div>
        <span className="font-mono text-[11px] text-aura-text-secondary">
          Ping: 18ms
        </span>
      </div>
    </div>
  );
};
