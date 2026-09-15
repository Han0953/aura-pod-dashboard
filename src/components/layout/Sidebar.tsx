import React from "react";
import {
  LayoutDashboard,
  Activity,
  Cpu,
  BarChart3,
  Settings,
  Radio,
  RefreshCw,
} from "lucide-react";
import { ViewId } from "@/types/navigation";
import { NAV_ITEMS, APP_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  isEspOnline: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  isEspOnline,
  onRefresh,
  isRefreshing = false,
}) => {

  const getNavIcon = (id: ViewId) => {
    switch (id) {
      case "overview":
        return <LayoutDashboard className="w-4 h-4" />;
      case "monitoring":
        return <Activity className="w-4 h-4" />;
      case "device":
        return <Cpu className="w-4 h-4" />;
      case "analytics":
        return <BarChart3 className="w-4 h-4" />;
      case "settings":
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <aside className="w-64 h-screen bg-aura-surface border-r border-aura-border flex flex-col justify-between shrink-0 select-none z-30 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center p-1.5 shadow-glow">
            <img
              src="/aura-pod-logo.svg"
              alt="AURA Pod"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-base text-aura-text-primary tracking-tight">
                AURA Pod
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider rounded bg-aura-surface-active text-aura-primary border border-aura-primary/30">
                IoT
              </span>
            </div>
            <span className="text-xs text-aura-text-secondary truncate">
              Bioreactor Dashboard
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-aura-text-secondary">
          Core Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          const isDisabled = item.disabled;

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onViewChange(item.id)}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer",
                isActive
                  ? "bg-aura-surface-active text-aura-primary border border-aura-primary/40 shadow-glow font-semibold"
                  : isDisabled
                  ? "text-aura-text-secondary/40 cursor-not-allowed hover:bg-transparent"
                  : "text-aura-text-secondary hover:text-aura-text-primary hover:bg-aura-surface-subtle"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-aura-primary"
                      : isDisabled
                      ? "text-aura-text-secondary/40"
                      : "text-aura-text-secondary group-hover:text-aura-text-primary"
                  )}
                >
                  {getNavIcon(item.id)}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-aura-surface-subtle text-aura-text-secondary font-mono border border-aura-border">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hardware Connection & Status Footer */}
      <div className="p-4 space-y-3 bg-aura-surface transition-colors duration-200">
        {/* ESP32 Hardware Status Card */}
        <div className="p-3 rounded-xl bg-aura-surface-subtle/50 border border-aura-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-aura-primary" />
              <span className="text-xs font-semibold text-aura-text-primary">ESP32 Core</span>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono",
                isEspOnline
                  ? "bg-aura-surface-active text-aura-primary border border-aura-primary/30"
                  : "bg-red-500/10 text-red-500 border border-red-500/30"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isEspOnline
                    ? "bg-aura-primary animate-pulse shadow-glow"
                    : "bg-red-500"
                )}
              />
              {isEspOnline ? "Online" : "Offline"}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-aura-text-secondary pt-1 border-t border-aura-border/60">
            <span>Blynk IoT Protocol</span>
            <span className="font-mono text-[10px] text-aura-primary">Ready</span>
          </div>

          {/* Real Sync Trigger with Blynk Cloud */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full mt-1.5 py-1 px-2 rounded-md bg-aura-surface-subtle hover:bg-aura-border/40 text-[10px] text-aura-text-secondary hover:text-aura-text-primary flex items-center justify-center gap-1.5 transition-colors border border-aura-border cursor-pointer disabled:opacity-50"
            title="Sinkronkan status telemetri perangkat dengan Blynk Cloud"
          >
            <RefreshCw className={cn("w-3 h-3 text-aura-primary", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronkan Blynk"}</span>
          </button>
        </div>

        {/* Version info */}
        <div className="flex items-center justify-between px-1 text-[11px] text-aura-text-secondary">
          <span>{APP_CONFIG.version}</span>
          <span>ESP32-WROOM</span>
        </div>
      </div>
    </aside>
  );
};
