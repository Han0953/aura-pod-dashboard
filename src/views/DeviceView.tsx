import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import {
  Cpu,
  RefreshCw,
} from "lucide-react";
import { HardwareDiagnostics } from "@/components/device/HardwareDiagnostics";
import { ActuatorControl } from "@/components/device/ActuatorControl";
import { DeviceStatusCard } from "@/components/device/DeviceStatusCard";
import { DashboardContextType } from "@/services/dashboardService";

interface DeviceViewProps {
  dashboard: DashboardContextType;
}

export const DeviceView: React.FC<DeviceViewProps> = ({ dashboard }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    deviceStatus,
    diagnostics,
    toggleLed,
    toggleAerator,
    toggleMode,
    refreshData,
    isRefreshing,
  } = dashboard;

  // GSAP Staggered Entrance Animation for Device cards (scoped & clean)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Immediately hide elements before first paint
      gsap.set(".device-stagger-card", { opacity: 0, y: 32, scale: 0.98 });

      // Stagger in cards 1 by 1
      gsap.to(".device-stagger-card", {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.08,
        delay: 0.05,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* Top Banner: Device Overview & Status Action */}
      <div className="device-stagger-card p-6 rounded-2xl bg-gradient-to-r from-aura-surface to-aura-surface-active/30 border border-aura-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-aura-surface-active border border-aura-primary/40 flex items-center justify-center text-aura-primary shadow-glow">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-aura-text-primary tracking-tight">
                {diagnostics.deviceName}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-aura-surface-active text-aura-primary text-xs font-mono border border-aura-primary/30">
                {diagnostics.deviceId}
              </span>
            </div>
            <p className="text-xs text-aura-text-secondary mt-0.5">
              Dual-core Xtensa 32-bit MCU · Firmware: {diagnostics.firmwareVersion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-aura-surface-active hover:bg-aura-border/40 text-xs font-semibold text-aura-primary border border-aura-primary/30 transition-colors shadow-glow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Hardware Health Ping</span>
          </button>
        </div>
      </div>

      {/* Row 1: Actuator Direct Overrides & Hardware Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="device-stagger-card lg:col-span-6">
          <ActuatorControl
            ledOn={deviceStatus.led}
            aeratorOn={deviceStatus.aerator}
            onToggleLed={toggleLed}
            onToggleAerator={toggleAerator}
            mode={deviceStatus.mode}
            onToggleMode={toggleMode}
            disabled={!deviceStatus.online}
          />
        </div>

        <div className="device-stagger-card lg:col-span-6">
          <DeviceStatusCard
            deviceStatus={deviceStatus}
          />
        </div>
      </div>

      {/* Row 2: Comprehensive Diagnostics & Pin Mapping Table */}
      <div className="device-stagger-card">
        <HardwareDiagnostics
          diagnostics={diagnostics}
          isOnline={deviceStatus.online}
          deviceStatus={deviceStatus}
          sensorData={dashboard.sensorData}
          manualSyncCount={dashboard.manualSyncCount}
        />
      </div>
    </div>
  );
};
