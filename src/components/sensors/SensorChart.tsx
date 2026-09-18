import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MultiSeriesSensorPoint, TimeRange } from "@/types/sensor";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface SensorChartProps {
  data: MultiSeriesSensorPoint[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  currentTemp?: number;
  currentGas?: number | null;
  title?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  isDark?: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, isDark = true }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className={cn(
        "p-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs space-y-2",
        isDark
          ? "bg-[#0A1915]/95 border-[#16332B] text-white"
          : "bg-white/95 border-[#E2E8F0] text-slate-900"
      )}
    >
      <div
        className={cn(
          "text-[11px] font-mono border-b pb-1",
          isDark ? "text-[#7D9B91] border-[#16332B]" : "text-slate-500 border-slate-200"
        )}
      >
        Waktu: <span className="font-medium font-mono">{label}</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          let labelText = "Temperature";
          let unit = "°C";

          if (entry.name === "temperature") {
            labelText = "Temperature (DS18B20)";
            unit = "°C";
          } else if (entry.name === "gasIndex") {
            labelText = "Gas Index (MQ-135)";
            unit = "AQI";
          }

          return (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className={isDark ? "text-[#7D9B91]" : "text-slate-600"}>
                  {labelText}:
                </span>
              </div>
              <span className="font-mono font-bold tabular-nums">
                {entry.value} {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SensorChart: React.FC<SensorChartProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  currentTemp = 24.3,
  currentGas = 142,
  title = "Sensor Trends & Telemetry",
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const timeRanges: TimeRange[] = ["1H", "24H", "7D", "30D"];

  // Precise chart colors depending on theme per DESIGN.md
  const tempColor = isDark ? "#00E599" : "#059669";
  const gasColor = isDark ? "#F59E0B" : "#D97706";
  const gridColor = isDark ? "#16332B" : "#E2E8F0";
  const axisTextColor = isDark ? "#7D9B91" : "#64748B";

  return (
    <div className="flex flex-col bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm transition-colors duration-200">
      {/* Chart Header & Timeframe Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-bold text-aura-text-primary tracking-tight">
              {title}
            </h2>
            <span className="w-2 h-2 rounded-full bg-aura-primary animate-ping" />
          </div>
          <p className="text-xs text-aura-text-secondary mt-0.5">
            Aliran telemetri waktu-nyata · Sinkronisasi multi-parameter sensor
          </p>
        </div>

        {/* Timeframe selector segmented pills */}
        <div className="inline-flex p-1 rounded-xl bg-aura-surface-subtle border border-aura-border self-start sm:self-auto gap-1">
          {timeRanges.map((range) => {
            const isActive = timeRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => onTimeRangeChange(range)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer",
                  isActive
                    ? "bg-aura-surface text-aura-primary border border-aura-border shadow-sm font-bold"
                    : "text-aura-text-secondary hover:text-aura-text-primary hover:bg-aura-border/40"
                )}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={tempColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={tempColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={gridColor}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="timeLabel"
              stroke={axisTextColor}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis
              stroke={axisTextColor}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              domain={[0, (dataMax: number) => (dataMax <= 5 ? 30 : Math.ceil(dataMax + 2))]}
            />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />

              {/* Temperature Line & Area */}
              <Area
                type="monotone"
                dataKey="temperature"
                stroke={tempColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTemp)"
              />
            </AreaChart>
          </ResponsiveContainer>
      </div>

      {/* Interactive Legend Matrix with Live Values */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4 mt-2 bg-aura-surface-subtle rounded-xl p-3 border border-aura-border">
        <div className="flex items-center gap-2 text-xs">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: tempColor }}
          />
          <span className="text-aura-text-secondary">
            Temperature (DS18B20):{" "}
            <span className="text-aura-text-primary font-mono font-bold tabular-nums">
              {currentTemp > 0 ? `${currentTemp} °C` : "--"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: gasColor }}
          />
          <span className="text-aura-text-secondary">
            Gas Index (MQ-135):{" "}
            <span className="text-aura-text-primary font-mono font-bold tabular-nums">
              {currentGas !== null && currentGas > 0 ? `${currentGas} AQI` : "--"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
