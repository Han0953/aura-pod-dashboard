import React, { useLayoutEffect, useRef, useMemo, useState } from "react";
import gsap from "gsap";
import {
  BarChart3,
  Thermometer,
  Wind,
  Clock,
  Database,
  Layers,
  Sparkles,
  Download,
  CheckCircle2,
  Activity,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ZAxis,
} from "recharts";
import { DashboardContextType } from "@/services/dashboardService";
import { useTheme } from "@/context/ThemeContext";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SENSOR_THRESHOLDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AnalyticsViewProps {
  dashboard: DashboardContextType;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ dashboard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    deviceStatus,
    diagnostics,
    carbonMetric,
    biomassMetric,
    telemetryHistory,
    timeRange,
    setTimeRange,
    notifications,
  } = dashboard;

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // GSAP Staggered Entrance Animation (scoped & clean)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".analytics-stagger-card", { opacity: 0, y: 28, scale: 0.98 });
      gsap.to(".analytics-stagger-card", {
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

  // Theme-aware chart colors
  const primaryMint = isDark ? "#00E599" : "#059669";
  const secondaryAmber = isDark ? "#F59E0B" : "#D97706";
  const secondaryCyan = isDark ? "#38BDF8" : "#0284C7";
  const gridColor = isDark ? "#16332B" : "#E2E8F0";
  const axisTextColor = isDark ? "#7D9B91" : "#64748B";

  // Filter valid telemetry numbers
  const tempValues = useMemo(
    () =>
      telemetryHistory
        .map((p) => p.temperature)
        .filter((t): t is number => typeof t === "number" && t > 0),
    [telemetryHistory]
  );

  const gasValues = useMemo(
    () =>
      telemetryHistory
        .map((p) => p.gasIndex)
        .filter((g): g is number => typeof g === "number" && g !== null && g > 0),
    [telemetryHistory]
  );

  // Summary Metrics calculations
  const avgTemp = useMemo(() => {
    if (!deviceStatus.online || !tempValues.length) return "--";
    const sum = tempValues.reduce((acc, curr) => acc + curr, 0);
    return (sum / tempValues.length).toFixed(1);
  }, [deviceStatus.online, tempValues]);

  const peakGasIndex = useMemo(() => {
    if (!deviceStatus.online || !gasValues.length) return "--";
    return Math.round(Math.max(...gasValues)).toString();
  }, [deviceStatus.online, gasValues]);

  const avgGasIndex = useMemo(() => {
    if (!deviceStatus.online || !gasValues.length) return "--";
    const sum = gasValues.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / gasValues.length).toString();
  }, [deviceStatus.online, gasValues]);

  // Temperature Distribution Histogram Data
  const tempDistributionData = useMemo(() => {
    const buckets = [
      { range: "<21°C", label: "<21.0°C", min: 0, max: 21.0, count: 0, optimal: false },
      { range: "21-22°C", label: "21.0-21.9°C", min: 21.0, max: 22.0, count: 0, optimal: false },
      { range: "22-23°C", label: "22.0-22.9°C", min: 22.0, max: 23.0, count: 0, optimal: true },
      { range: "23-24°C", label: "23.0-23.9°C", min: 23.0, max: 24.0, count: 0, optimal: true },
      { range: "24-25°C", label: "24.0-24.9°C", min: 24.0, max: 25.0, count: 0, optimal: true },
      { range: "25-26°C", label: "25.0-25.9°C", min: 25.0, max: 26.0, count: 0, optimal: true },
      { range: ">26°C", label: "≥26.0°C", min: 26.0, max: 99.0, count: 0, optimal: false },
    ];

    tempValues.forEach((temp) => {
      for (const b of buckets) {
        if (temp >= b.min && temp < b.max) {
          b.count += 1;
          break;
        }
      }
    });

    return buckets;
  }, [tempValues]);

  // Scatter Correlation Data: Temp (°C) vs Gas Index (AQI Idx)
  const correlationData = useMemo(() => {
    return telemetryHistory
      .filter((p) => typeof p.temperature === "number" && p.gasIndex !== null)
      .map((p) => ({
        temp: Number(p.temperature.toFixed(1)),
        gas: p.gasIndex,
        time: p.timeLabel,
      }));
  }, [telemetryHistory]);

  // CSV Export Functionality
  const handleExportCSV = () => {
    if (!telemetryHistory.length) return;

    const headers = ["Timestamp", "TimeLabel", "Temperature_Celsius", "GasIndex_AQI_Idx"];
    const rows = telemetryHistory.map((pt) => [
      pt.timestamp,
      `"${pt.timeLabel}"`,
      pt.temperature,
      pt.gasIndex !== null ? pt.gasIndex : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aura-pod-telemetry-${timeRange.toLowerCase()}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* ── Top View Header & Actions ── */}
      <div className="analytics-stagger-card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-aura-surface border border-aura-border rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-aura-surface-active text-aura-primary border border-aura-primary/30">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="font-heading text-lg font-bold text-aura-text-primary tracking-tight">
              Bioreactor Analytical Engine
            </h2>
            <StatusBadge variant={deviceStatus.online ? "online" : "offline"} />
          </div>
          <p className="text-xs text-aura-text-secondary mt-1 max-w-2xl">
            Agregasi statistik suhu kultur (DS18B20) dan indeks gas volatil (MQ-135) pada rentang waktu terpilih.
          </p>
        </div>

        {/* Action Controls: Time Range Selector & CSV Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-aura-surface-subtle border border-aura-border gap-1">
            {(["1H", "24H", "7D", "30D"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer",
                  timeRange === range
                    ? "bg-aura-surface text-aura-primary border border-aura-border shadow-sm font-bold"
                    : "text-aura-text-secondary hover:text-aura-text-primary hover:bg-aura-border/40"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
              downloadSuccess
                ? "bg-aura-primary/20 text-aura-primary border-aura-primary"
                : "bg-aura-surface-subtle border-aura-border text-aura-text-primary hover:bg-aura-surface-active hover:border-aura-primary/40"
            )}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-aura-primary" />
                <span>Exported!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-aura-text-secondary" />
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Temperature */}
        <div className="analytics-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-medium uppercase tracking-wider">Average Temp</span>
            <div className="p-2 rounded-xl bg-aura-surface-subtle border border-aura-border text-aura-primary">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-aura-text-primary tabular-nums font-mono">
              {avgTemp}
            </span>
            <span className="text-xs text-aura-text-secondary font-mono">°C</span>
          </div>
          <div className="mt-2 text-[11px] text-aura-text-secondary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-aura-primary" />
            <span>Rentang Optimal: {SENSOR_THRESHOLDS.temperature.toleranceStr}</span>
          </div>
        </div>

        {/* Card 2: Peak Gas Index (MQ-135 AQI Idx) */}
        <div className="analytics-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-medium uppercase tracking-wider">Peak Gas Index</span>
            <div className="p-2 rounded-xl bg-aura-surface-subtle border border-aura-border text-aura-amber">
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-aura-text-primary tabular-nums font-mono">
              {peakGasIndex}
            </span>
            <span className="text-xs text-aura-text-secondary font-mono">Idx (Avg: {avgGasIndex})</span>
          </div>
          <div className="mt-2 text-[11px] text-aura-text-secondary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-aura-amber" />
            <span>Metrik AQI relatif (MQ-135)</span>
          </div>
        </div>

        {/* Card 3: System Uptime */}
        <div className="analytics-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-medium uppercase tracking-wider">ESP32 Uptime</span>
            <div className="p-2 rounded-xl bg-aura-surface-subtle border border-aura-border text-aura-cyan">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-aura-text-primary tabular-nums font-mono">
              {diagnostics.uptime}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-aura-text-secondary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-aura-cyan" />
            <span>{deviceStatus.online ? `${diagnostics.wifiSsid} (${diagnostics.wifiSignalDbm} dBm)` : "Perangkat Terputus"}</span>
          </div>
        </div>

        {/* Card 4: Telemetry Sample Count */}
        <div className="analytics-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-aura-text-secondary">
            <span className="text-xs font-medium uppercase tracking-wider">Sample Records</span>
            <div className="p-2 rounded-xl bg-aura-surface-subtle border border-aura-border text-aura-text-secondary">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-aura-text-primary tabular-nums font-mono">
              {deviceStatus.online ? telemetryHistory.length : 0}
            </span>
            <span className="text-xs text-aura-text-secondary font-mono">titik data</span>
          </div>
          <div className="mt-2 text-[11px] text-aura-text-secondary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-aura-primary animate-pulse" />
            <span>Resolusi: Jendela waktu {timeRange}</span>
          </div>
        </div>
      </div>

      {/* ── Row: Charts Section (Histogram & Gas Area) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Temperature Distribution Histogram (6 cols) */}
        <div className="analytics-stagger-card lg:col-span-6 bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-aura-primary" />
                <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
                  Culture Temperature Distribution
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-aura-surface-subtle border border-aura-border text-aura-text-secondary">
                DS18B20
              </span>
            </div>
            <p className="text-xs text-aura-text-secondary mt-1">
              Frekuensi pembacaan suhu pada setiap rentang batas. Warna hijau menandakan batas pertumbuhan optimal alga.
            </p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tempDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="range"
                  stroke={axisTextColor}
                  fontSize={10}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke={axisTextColor}
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "rgba(0, 229, 153, 0.05)" : "rgba(5, 150, 105, 0.05)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl border bg-aura-surface/95 border-aura-border shadow-xl text-xs space-y-1 backdrop-blur-md">
                        <div className="font-semibold text-aura-text-primary">{d.label}</div>
                        <div className="text-aura-text-secondary flex items-center justify-between gap-3">
                          <span>Readings:</span>
                          <span className="font-mono font-bold text-aura-primary">{d.count}</span>
                        </div>
                        <div className="text-[10px] text-aura-text-secondary">
                          {d.optimal ? "✓ Inside optimal growth range" : "⚠ Outside standard window"}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {tempDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.optimal ? primaryMint : isDark ? "#1A3D34" : "#CBD5E1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-aura-border/60 text-xs text-aura-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-aura-primary" />
              <span>Optimal (22–26°C)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-aura-border" />
              <span>Sub-optimal (&lt;22°C / &gt;26°C)</span>
            </div>
          </div>
        </div>

        {/* Gas Index Fluctuation Profile (6 cols) */}
        <div className="analytics-stagger-card lg:col-span-6 bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-aura-amber" />
                <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
                  Gas Index Fluctuation (MQ-135)
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-aura-surface-subtle border border-aura-border text-aura-amber">
                AQI Idx
              </span>
            </div>
            <p className="text-xs text-aura-text-secondary mt-1">
              Fluktuasi relatif pertukaran gas dari waktu ke waktu (Catatan: Indikator relatif MQ-135, bukan ppm CO₂).
            </p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={telemetryHistory}
                margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="gasAnalyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={secondaryAmber} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={secondaryAmber} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="timeLabel"
                  stroke={axisTextColor}
                  fontSize={10}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke={axisTextColor}
                  fontSize={10}
                  tickLine={false}
                  domain={["dataMin - 10", "dataMax + 15"]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const val = payload[0].value;
                    return (
                      <div className="p-3 rounded-xl border bg-aura-surface/95 border-aura-border shadow-xl text-xs space-y-1 backdrop-blur-md">
                        <div className="text-[10px] font-mono text-aura-text-secondary">Time: {label}</div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-aura-text-secondary">Gas Index:</span>
                          <span className="font-mono font-bold text-aura-amber">{val} Idx</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="gasIndex"
                  stroke={secondaryAmber}
                  strokeWidth={2}
                  fill="url(#gasAnalyticsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-aura-border/60 text-xs text-aura-text-secondary">
            <span>Peak: <strong className="text-aura-amber font-mono">{peakGasIndex} Idx</strong></span>
            <span>Average: <strong className="text-aura-text-primary font-mono">{avgGasIndex} Idx</strong></span>
            <span>Sensor: MQ-135 (ADC1 GPIO 34)</span>
          </div>
        </div>
      </div>

      {/* ── Thermal vs Gas Index Correlation Scatter Plot ── */}
      <div className="analytics-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-aura-cyan/10 text-aura-cyan border border-aura-cyan/30">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
                Temperature vs Gas Index Correlation
              </h3>
            </div>
            <p className="text-xs text-aura-text-secondary mt-1">
              Distribusi sebaran korelasi antara suhu kultur (°C) terhadap indeks gas headspace (AQI Idx)
            </p>
          </div>
          <span className="text-xs font-mono text-aura-text-secondary self-start sm:self-auto">
            {correlationData.length} plotted points
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                type="number"
                dataKey="temp"
                name="Temperature"
                unit="°C"
                stroke={axisTextColor}
                fontSize={10}
                tickLine={false}
                domain={["dataMin - 1", "dataMax + 1"]}
                dy={8}
              />
              <YAxis
                type="number"
                dataKey="gas"
                name="Gas Index"
                unit=" Idx"
                stroke={axisTextColor}
                fontSize={10}
                tickLine={false}
                domain={["dataMin - 15", "dataMax + 15"]}
              />
              <ZAxis range={[50, 70]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: gridColor }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="p-3 rounded-xl border bg-aura-surface/95 border-aura-border shadow-xl text-xs space-y-1.5 backdrop-blur-md">
                      <div className="text-[10px] font-mono text-aura-text-secondary">Sample @ {d.time}</div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-aura-primary">Culture Temp:</span>
                        <span className="font-mono font-bold text-aura-text-primary">{d.temp} °C</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-aura-amber">Gas Index:</span>
                        <span className="font-mono font-bold text-aura-text-primary">{d.gas} Idx</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter name="Telemetry Samples" data={correlationData} fill={secondaryCyan} opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── MRV (Monitoring, Reporting, Verification) Phase 2 Banner ── */}
      <div className="analytics-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-aura-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded bg-aura-primary/10 text-aura-primary border border-aura-primary/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="font-heading text-base font-bold text-aura-text-primary">
                MRV Analytics &amp; Carbon Sequestration Modeling
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-aura-amber/10 border border-aura-amber/30 text-aura-amber text-[10px] font-mono uppercase font-semibold">
                Fase 2 / In Development
              </span>
            </div>

            <p className="text-xs text-aura-text-secondary leading-relaxed">
              Kuantifikasi carbon capture dan biomassa mikroalga memerlukan kalibrasi sensor optik OD680
              serta perhitungan stoikiometri serapan karbon kultur yang terakreditasi. Metrik yang tercantum
              pada dashboard saat ini bersifat <strong>estimasi prototype</strong> untuk keperluan pengujian UI/UX.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-aura-surface-subtle border border-aura-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-aura-text-secondary">Estimated Daily Capture</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-aura-primary/10 text-aura-primary">
                    Estimated
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-aura-text-primary mt-1">
                  {carbonMetric.sequestrationDailyKg} <span className="text-xs font-normal text-aura-text-secondary">kg CO₂/day</span>
                </div>
                <div className="text-[11px] text-aura-text-secondary mt-0.5">
                  Algorithmic estimate from culture volume
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-aura-surface-subtle border border-aura-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-aura-text-secondary">Optical Density (OD680)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-aura-cyan/10 text-aura-cyan">
                    Estimated
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-aura-text-primary mt-1">
                  {biomassMetric.opticalDensity680 ?? "1.28"}{" "}
                  <span className="text-xs font-normal text-aura-text-secondary">Abs</span>
                </div>
                <div className="text-[11px] text-aura-text-secondary mt-0.5">
                  Dry biomass: ~{biomassMetric.dryBiomassDensityGPerL ?? "0.84"} g/L
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-72 shrink-0 p-4 rounded-xl bg-aura-surface-subtle/80 border border-aura-border text-xs space-y-2.5">
            <div className="font-semibold text-aura-text-primary flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-aura-cyan" />
              <span>Verifikasi Standar MRV</span>
            </div>
            <p className="text-aura-text-secondary text-[11px] leading-relaxed">
              Pada Fase 2, AURA Pod akan mengintegrasikan sensor spektrofotometri multi-panjang gelombang
              dan kalkulator kredit karbon bersertifikasi ISO 14064-2.
            </p>
            <div className="pt-1">
              <span className="inline-block text-[10px] font-mono text-aura-primary bg-aura-surface-active px-2 py-1 rounded border border-aura-primary/30">
                Methodology: ALGAE-MRV-v0.1-DRAFT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── System Event & Alert Stream ── */}
      <div className="analytics-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-aura-surface-subtle text-aura-text-primary border border-aura-border">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
              Operational Event &amp; Anomaly Log
            </h3>
          </div>
          <span className="text-xs text-aura-text-secondary font-mono">
            {notifications.length} logged events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-aura-border text-aura-text-secondary">
                <th className="py-2.5 px-3 font-semibold">Severity</th>
                <th className="py-2.5 px-3 font-semibold">Message</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border/60">
              {notifications.map((notif) => {
                const getBadgeVariant = () => {
                  switch (notif.severity) {
                    case "error":
                      return "error";
                    case "warning":
                      return "warning";
                    case "success":
                      return "active";
                    default:
                      return "normal";
                  }
                };

                return (
                  <tr key={notif.id} className="hover:bg-aura-surface-subtle/50 transition-colors">
                    <td className="py-3 px-3">
                      <StatusBadge variant={getBadgeVariant()} label={notif.severity} />
                    </td>
                    <td className="py-3 px-3 text-aura-text-primary font-medium">
                      {notif.message}
                    </td>
                    <td className="py-3 px-3 text-aura-text-secondary font-mono text-[11px]">
                      {notif.title}
                    </td>
                    <td className="py-3 px-3 text-right text-aura-text-secondary font-mono text-[11px]">
                      {new Date(notif.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
