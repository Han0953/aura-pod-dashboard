import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import {
  Thermometer,
  Wind,
  Download,
  TrendingUp,
  Table as TableIcon,
} from "lucide-react";
import { SensorChart } from "@/components/sensors/SensorChart";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DashboardContextType } from "@/services/dashboardService";
import { SENSOR_THRESHOLDS } from "@/lib/constants";

interface MonitoringViewProps {
  dashboard: DashboardContextType;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({ dashboard }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    sensorData,
    deviceStatus,
    telemetryHistory,
    timeRange,
    setTimeRange,
  } = dashboard;

  const isOffline = !deviceStatus.online;

  // GSAP Staggered Entrance Animation for Monitoring cards (scoped & clean)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Immediately hide elements before first paint
      gsap.set(".monitoring-stagger-card", { opacity: 0, y: 32, scale: 0.98 });

      // Stagger in cards 1 by 1
      gsap.to(".monitoring-stagger-card", {
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

  // Temperature status calculation
  const getTempStatus = () => {
    if (isOffline) return "offline";
    if (
      sensorData.temperature < SENSOR_THRESHOLDS.temperature.optimalMin ||
      sensorData.temperature > SENSOR_THRESHOLDS.temperature.optimalMax
    ) {
      return "warning";
    }
    return "normal";
  };

  // Gas index status calculation
  const getGasStatus = () => {
    if (isOffline) return "offline";
    if (sensorData.gasIndex === null) return "unavailable";
    if (sensorData.gasIndex > 200) return "warning";
    return "normal";
  };

  // Compute dynamic stats from real telemetry data
  const tempValues = telemetryHistory
    .map((p) => p.temperature)
    .filter((t): t is number => typeof t === "number" && t > 0);
  const minTemp = tempValues.length > 0 ? Math.min(...tempValues).toFixed(1) : "--";
  const maxTemp = tempValues.length > 0 ? Math.max(...tempValues).toFixed(1) : "--";

  const gasValues = telemetryHistory
    .map((p) => p.gasIndex)
    .filter((g): g is number => typeof g === "number");
  const minGas = gasValues.length > 0 ? Math.min(...gasValues) : "--";
  const maxGas = gasValues.length > 0 ? Math.max(...gasValues) : "--";

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* Section 1: Comparative Detailed Sensor Clusters (2 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cluster 1: DS18B20 Temperature */}
        <div className="monitoring-stagger-card flex flex-col">
          <div className="rounded-2xl bg-aura-surface border border-aura-border hover:border-aura-border-hover p-6 flex flex-col justify-between shadow-sm transition-colors flex-1">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center text-aura-primary shadow-glow">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-aura-text-primary">
                      Culture Temperature
                    </h3>
                    <span className="text-[10px] text-aura-text-secondary font-mono uppercase tracking-wider">
                      DS18B20 1-Wire
                    </span>
                  </div>
                </div>
                <StatusBadge
                  variant={getTempStatus()}
                  label={isOffline ? "Offline" : getTempStatus() === "warning" ? "Attention" : "Optimal"}
                />
              </div>

              <div className="flex items-baseline justify-between pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-bold text-aura-text-primary tabular-nums">
                    {isOffline ? "--" : sensorData.temperature}
                  </span>
                  <span className="text-sm font-medium text-aura-text-secondary">
                    °C
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-aura-primary font-mono">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Live Stream</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-aura-border text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-aura-text-secondary">
                  Min / Max (Sesi Rill)
                </span>
                <span className="font-mono font-bold text-aura-text-primary mt-0.5">
                  {minTemp}° / {maxTemp}°
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-aura-text-secondary">
                  Titik Rekaman
                </span>
                <span className="font-mono font-bold text-aura-primary mt-0.5">
                  {tempValues.length} Data Pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cluster 2: MQ-135 Gas Index */}
        <div className="monitoring-stagger-card flex flex-col">
          <div className="rounded-2xl bg-aura-surface border border-aura-border hover:border-aura-border-hover p-6 flex flex-col justify-between shadow-sm transition-colors flex-1">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-aura-amber/10 border border-aura-amber/30 flex items-center justify-center text-aura-amber shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-aura-text-primary">
                      Gas Quality Index
                    </h3>
                    <span className="text-[10px] text-aura-text-secondary font-mono uppercase tracking-wider">
                      MQ-135 Indicator
                    </span>
                  </div>
                </div>
                <StatusBadge
                  variant={getGasStatus()}
                  label={isOffline ? "Offline" : getGasStatus() === "warning" ? "Caution" : "Nominal"}
                />
              </div>

              <div className="flex items-baseline justify-between pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-bold text-aura-text-primary tabular-nums">
                    {isOffline ? "--" : (sensorData.gasIndex ?? 0)}
                  </span>
                  <span className="text-sm font-medium text-aura-amber">AQI Idx</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-aura-amber font-mono">
                  <span>Rel. Diffusion</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-aura-border text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-aura-text-secondary">
                  Min / Max (Sesi Rill)
                </span>
                <span className="font-mono font-bold text-aura-text-primary mt-0.5">
                  {minGas} / {maxGas} AQI
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-aura-text-secondary">
                  Titik Rekaman
                </span>
                <span className="font-mono font-bold text-aura-amber mt-0.5">
                  {gasValues.length} Data Pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Main Telemetry Recharts Graph */}
      <div className="monitoring-stagger-card">
        <SensorChart
          data={telemetryHistory}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          currentTemp={sensorData.temperature}
          currentGas={sensorData.gasIndex}
          title="Multi-Parameter Telemetry Stream & Convergence"
        />
      </div>

      {/* Section 3: Telemetry Stream Log Table */}
      <div className="monitoring-stagger-card">
        <div className="rounded-2xl bg-aura-surface border border-aura-border p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center text-aura-primary">
                <TableIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-aura-text-primary tracking-tight">
                  Recent Telemetry Sampling Log
                </h3>
                <p className="text-xs text-aura-text-secondary">
                  Titik data yang terekam dan disinkronkan langsung dari bus telemetri ESP32
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => alert("Data log exported as CSV for MRV record")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aura-surface-subtle hover:bg-aura-border/40 text-xs font-medium text-aura-text-primary border border-aura-border transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-aura-primary" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-aura-border text-aura-text-secondary uppercase tracking-wider font-mono text-[11px]">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Culture Temp (°C)</th>
                  <th className="pb-3 font-semibold">Gas Index (AQI)</th>
                  <th className="pb-3 font-semibold">Status Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-border/60 font-mono">
                {telemetryHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-aura-text-secondary text-xs">
                      Belum ada riwayat telemetri. Data akan otomatis tercatat saat ESP32 aktif mengirim data ke Blynk.
                    </td>
                  </tr>
                ) : (
                  telemetryHistory.slice(-8).reverse().map((point, index) => (
                    <tr
                      key={point.timestamp}
                      className="hover:bg-aura-surface-subtle transition-colors"
                    >
                      <td className="py-3 text-aura-text-secondary">
                        {point.timeLabel} {index === 0 && <span className="text-aura-primary font-bold">(Latest)</span>}
                      </td>
                      <td className="py-3 text-aura-text-primary font-bold tabular-nums">
                        {point.temperature} °C
                      </td>
                      <td className="py-3 text-aura-amber font-bold tabular-nums">
                        {point.gasIndex} AQI
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-aura-surface-active text-aura-primary text-[10px] border border-aura-primary/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-aura-primary" />
                          Nominal
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

