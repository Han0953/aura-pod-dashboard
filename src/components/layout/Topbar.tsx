import React from "react";
import { RefreshCw, Radio, Bell, Sun, Moon } from "lucide-react";
import { ViewId } from "@/types/navigation";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface TopbarProps {
  activeView: ViewId;
  isEspOnline: boolean;
  lastUpdatedText: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeView,
  isEspOnline,
  lastUpdatedText,
  isRefreshing,
  onRefresh,
}) => {
  const { theme, toggleTheme } = useTheme();

  const getHeaderInfo = () => {
    switch (activeView) {
      case "overview":
        return {
          title: "System Overview",
          subtitle: "Live telemetry, photoperiod lighting, and microalgae culture health",
        };
      case "monitoring":
        return {
          title: "Sensor Telemetry & Trends",
          subtitle: "DS18B20 temperature and MQ-135 Gas Index analytics",
        };
      case "device":
        return {
          title: "Device Management & Hardware Diagnostics",
          subtitle: "ESP32 controller metrics, sensor health checks, and actuator overrides",
        };
      case "analytics":
        return {
          title: "Advanced Analytics",
          subtitle: "Historical regression and photobiological modeling",
        };
      case "settings":
        return {
          title: "Settings & Configurations",
          subtitle: "Blynk IoT credentials, alert thresholds, and network parameters",
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <header className="h-18 px-8 bg-aura-surface/75 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      {/* Left: View Title & Subtitle */}
      <div className="flex flex-col py-3">
        <h1 className="font-heading text-lg font-bold text-aura-text-primary tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-aura-text-secondary truncate">{subtitle}</p>
      </div>

      {/* Right: Actions and Status indicators */}
      <div className="flex items-center gap-3">
        {/* SINGLE Theme Toggle Button as explicitly requested */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
          title={theme === "dark" ? "Ganti ke Light Mode (Putih)" : "Ganti ke Dark Mode (Gelap Hijau)"}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium font-mono transition-all duration-200 active:scale-95 shadow-sm cursor-pointer",
            theme === "dark"
              ? "bg-aura-surface-active border-aura-primary/40 text-aura-primary hover:bg-aura-border/50 shadow-glow"
              : "bg-white border-aura-border text-aura-text-primary hover:bg-aura-surface-subtle shadow-sm"
          )}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold">Dark Mode</span>
            </>
          )}
        </button>

        {/* Sync Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aura-surface-subtle border border-aura-border text-xs">
          <div className="flex items-center gap-1.5">
            <Radio
              className={cn(
                "w-3 h-3",
                isEspOnline ? "text-aura-primary animate-pulse" : "text-red-500"
              )}
            />
            <span
              className={cn(
                "font-medium",
                isEspOnline ? "text-aura-text-primary" : "text-red-500"
              )}
            >
              {isEspOnline ? "ESP32 Sync" : "ESP32 Disconnected"}
            </span>
          </div>
          <span className="text-aura-text-secondary/50">|</span>
          <span className="text-aura-text-secondary font-mono text-[11px]">
            {lastUpdatedText}
          </span>
        </div>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-aura-surface-subtle border border-aura-border text-aura-text-secondary hover:text-aura-text-primary hover:border-aura-primary/40 active:scale-95 transition-all cursor-pointer"
          title="Sinkronisasi manual"
        >
          <RefreshCw
            className={cn("w-4 h-4", isRefreshing && "animate-spin text-aura-primary")}
          />
        </button>

        {/* Notifications Icon */}
        <div className="relative p-2 rounded-lg bg-aura-surface-subtle border border-aura-border text-aura-text-secondary hover:text-aura-text-primary transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-aura-primary" />
        </div>
      </div>
    </header>
  );
};
