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
  const isOnline = deviceStatus.online;

  const hardwareUnits = [
    {
      name: "ESP32 Core",
      detail: "WROOM-32D Dual-Core SoC",
      icon: <Cpu className="w-4 h-4 text-aura-primary" />,
      status: isOnline ? "Online" : "Offline",
      statusColor: isOnline ? "text-aura-primary bg-aura-surface-active" : "text-red-500 bg-red-500/10",
      isPulse: isOnline,
    },
    {
      name: "LED Grow Light",
      detail: "Full Spectrum 660/450nm",
      icon: <Lightbulb className="w-4 h-4 text-aura-primary" />,
      status: isOnline && deviceStatus.led ? "ON" : "OFF",
      statusColor: isOnline && deviceStatus.led ? "text-aura-primary bg-aura-primary/10 font-bold" : "text-aura-text-secondary bg-aura-surface-subtle",
      isPulse: false,
    },
    {
      name: "Aerator Pump",
      detail: "Micro-bubble Venturi",
      icon: <Fan className="w-4 h-4 text-aura-primary" />,
      status: isOnline && deviceStatus.aerator ? "ON" : "OFF",
      statusColor: isOnline && deviceStatus.aerator ? "text-aura-primary bg-aura-primary/10 font-bold" : "text-aura-text-secondary bg-aura-surface-subtle",
      isPulse: false,
    },
    {
      name: "MQ-135 Sensor",
      detail: "Gas Quality & Air Index",
      icon: <Wind className="w-4 h-4 text-aura-amber" />,
      status: isOnline ? "Active" : "Offline",
      statusColor: isOnline ? "text-aura-amber bg-aura-amber/10" : "text-aura-text-secondary bg-aura-surface-subtle",
      isPulse: false,
    },
    {
      name: "DS18B20 Sensor",
      detail: "Waterproof Temp Probe",
      icon: <Thermometer className="w-4 h-4 text-aura-primary" />,
      status: isOnline ? "Active" : "Offline",
      statusColor: isOnline ? "text-aura-primary bg-aura-surface-active" : "text-aura-text-secondary bg-aura-surface-subtle",
      isPulse: false,
    },
  ];

  const activeCount = isOnline
    ? hardwareUnits.filter((u) => u.status !== "Offline" && u.status !== "OFF").length
    : 0;

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
              className="text-xs text-aura-primary hover:text-aura-primary-hover flex items-center gap-1 group transition-colors cursor-pointer"
            >
              <span>View Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        <p className="text-xs text-aura-text-secondary mb-4">
          Status operasional modul sensor dan aktuator perangkat keras
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
          <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-aura-primary animate-pulse" : "bg-red-500")} />
          <span>
            <strong className="text-aura-text-primary font-mono">{activeCount}/{hardwareUnits.length}</strong>{" "}
            {isOnline ? "Unit Beroperasi Normal" : "Perangkat Terputus"}
          </span>
        </div>
        <span className="font-mono text-[11px] text-aura-text-secondary">
          {isOnline ? "Ping: 18ms" : "Ping: --"}
        </span>
      </div>
    </div>
  );
};
