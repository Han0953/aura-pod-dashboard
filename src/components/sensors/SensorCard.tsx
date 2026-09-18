import React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge, StatusVariant } from "@/components/common/StatusBadge";

interface SensorCardProps {
  title: string;
  hardwareSensor: string;
  value: number | string | null;
  unit?: string;
  status: StatusVariant;
  icon: React.ReactNode;
  colorTheme?: "mint" | "cyan" | "amber" | "emerald";
  sparkline?: "temp" | "gas" | "none";
  offline?: boolean;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  hardwareSensor,
  value,
  unit = "",
  status,
  icon,
  colorTheme = "mint",
  sparkline = "none",
  offline = false,
}) => {
  const getThemeStyles = () => {
    switch (colorTheme) {
      case "cyan":
        return {
          iconBg: "bg-aura-cyan/15 text-aura-cyan border border-aura-cyan/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]",
          sparkStroke: "#38BDF8",
          sparkGradientId: "cyanSparkGradient",
          sparkStop: "#38BDF8",
        };
      case "amber":
        return {
          iconBg: "bg-aura-amber/15 text-aura-amber border border-aura-amber/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
          sparkStroke: "#F59E0B",
          sparkGradientId: "amberSparkGradient",
          sparkStop: "#F59E0B",
        };
      case "mint":
      default:
        return {
          iconBg: "bg-aura-primary/15 text-aura-primary border border-aura-primary/30 shadow-glow",
          sparkStroke: "rgb(var(--primary-mint))",
          sparkGradientId: "mintSparkGradient",
          sparkStop: "rgb(var(--primary-mint))",
        };
    }
  };

  const theme = getThemeStyles();
  const displayValue = offline ? "--" : value !== null && value !== undefined ? value : 0;

  return (
    <div className="flex flex-col justify-between bg-aura-surface border border-aura-border hover:border-aura-border-hover p-5 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md group">
      {/* Card Header: Icon, Titles & Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
              theme.iconBg
            )}
          >
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-semibold text-aura-text-primary text-sm">
              {title}
            </span>
            <span className="text-[11px] text-aura-text-secondary font-mono uppercase tracking-wider">
              {hardwareSensor}
            </span>
          </div>
        </div>

        <StatusBadge
          variant={offline ? "offline" : status}
          label={offline ? "Offline" : undefined}
        />
      </div>

      {/* Main Metric Value & Mini Sparkline */}
      <div className="flex items-baseline justify-between mt-4 mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-3xl font-bold text-aura-text-primary tabular-nums tracking-tight font-mono">
            {displayValue}
          </span>
          {!offline && unit && (
            <span className="text-sm text-aura-text-secondary font-medium font-mono">
              {unit}
            </span>
          )}
        </div>

        {/* Mini SVG Sparkline */}
        {sparkline !== "none" && !offline && (
          <div className="w-24 h-9 overflow-visible transition-opacity">
            <svg
              className="w-full h-full overflow-visible"
              fill="none"
              viewBox="0 0 96 36"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={theme.sparkGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.sparkStop} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={theme.sparkStop} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {sparkline === "temp" && (
                <>
                  <path
                    d="M0 24 C 20 18, 40 28, 60 14 C 75 16, 85 10, 96 12 L 96 36 L 0 36 Z"
                    fill={`url(#${theme.sparkGradientId})`}
                  />
                  <path
                    d="M0 24 C 20 18, 40 28, 60 14 C 75 16, 85 10, 96 12"
                    stroke={theme.sparkStroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="96" cy="12" r="3" fill={theme.sparkStroke} />
                </>
              )}

              {sparkline === "gas" && (
                <>
                  <path
                    d="M0 26 C 15 28, 30 18, 50 20 C 70 22, 80 14, 96 16 L 96 36 L 0 36 Z"
                    fill={`url(#${theme.sparkGradientId})`}
                  />
                  <path
                    d="M0 26 C 15 28, 30 18, 50 20 C 70 22, 80 14, 96 16"
                    stroke={theme.sparkStroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="96" cy="16" r="3" fill={theme.sparkStroke} />
                </>
              )}
            </svg>
          </div>
        )}

        {sparkline !== "none" && offline && (
          <div className="w-24 h-9 flex items-center justify-center opacity-35">
            <svg className="w-full h-full" viewBox="0 0 96 36" fill="none">
              <line x1="0" y1="18" x2="96" y2="18" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-aura-text-secondary" />
            </svg>
          </div>
        )}
      </div>

      {/* Telemetry Status & Metadata Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-aura-border/60 text-xs text-aura-text-secondary">
        <span className="text-[11px] text-aura-text-secondary">
          {offline ? "Perangkat Terputus" : "Telemetri Aktif"}
        </span>
        <span className="text-[10px] text-aura-text-secondary font-mono">
          {offline ? "Siaga (Standby)" : "Polling 10d"}
        </span>
      </div>
    </div>
  );
};
