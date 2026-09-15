import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  LayoutDashboard,
  Activity,
  Cpu,
  BarChart3,
  Settings,
  Radio,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LogOut,
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
  isEntrance?: boolean;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  isEspOnline,
  onRefresh,
  isRefreshing = false,
  isEntrance = false,
  onLogout,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const sidebarRef = useRef<HTMLElement>(null);

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // GSAP Grand Entrance Wave & Living Icon Pop
  useEffect(() => {
    if (!isEntrance || !sidebarRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Sidebar Container Slide In
      gsap.fromTo(
        sidebarRef.current,
        { xPercent: -100, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
      );

      // 2. Navigation items staggered wave
      gsap.fromTo(
        ".sidebar-item-wave",
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          stagger: 0.06,
          delay: 0.25,
          ease: "power2.out",
        }
      );

      // 3. Living icon pop with elastic overshoot
      gsap.fromTo(
        ".sidebar-icon-pop",
        { scale: 0.2, rotate: -15, opacity: 0 },
        {
          scale: 1,
          rotate: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.06,
          delay: 0.3,
          ease: "back.out(2)",
        }
      );
    }, sidebarRef);

    return () => ctx.revert();
  }, [isEntrance]);

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
    <aside
      ref={sidebarRef}
      className={cn(
        "h-screen bg-aura-surface border-r border-aura-border flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* ── Brand Header ── */}
      <div className={cn("p-4 border-b border-aura-border/50", isCollapsed ? "px-3" : "px-5")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo Box: Fixed in place, never shifts or disappears */}
            <div className="w-11 h-11 rounded-xl bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center p-1.5 shadow-glow shrink-0">
              <img
                src="/aura-pod-logo.svg"
                alt="AURA Pod"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Brand Texts: Disappear smoothly when collapsed */}
            <div
              className={cn(
                "flex flex-col transition-all duration-300 whitespace-nowrap overflow-hidden",
                isCollapsed ? "opacity-0 max-w-0 pointer-events-none -translate-x-2" : "opacity-100 max-w-[140px] translate-x-0"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-base text-aura-text-primary tracking-tight">
                  AURA Pod
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-aura-surface-active text-aura-primary border border-aura-primary/30">
                  IoT
                </span>
              </div>
              <span className="text-[11px] text-aura-text-secondary truncate">
                Bioreactor Dashboard
              </span>
            </div>
          </div>

          {/* Collapse Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-aura-text-secondary hover:text-aura-text-primary hover:bg-aura-surface-subtle transition-colors cursor-pointer shrink-0"
              title="Tutup Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dedicated centered toggle button when collapsed */}
        {isCollapsed && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-aura-text-secondary hover:text-aura-text-primary hover:bg-aura-surface-subtle transition-colors cursor-pointer"
              title="Buka Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation Links ── */}
      <div className="flex-1 py-4 px-2.5 overflow-y-auto space-y-1 overflow-x-hidden">
        <div
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider text-aura-text-secondary transition-all duration-300 overflow-hidden whitespace-nowrap",
            isCollapsed ? "opacity-0 max-w-0 h-0 my-0 py-0" : "px-3 py-1.5 opacity-100 max-w-full"
          )}
        >
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
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "sidebar-item-wave w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer relative",
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5",
                isActive
                  ? "bg-aura-surface-active text-aura-primary border border-aura-primary/40 shadow-glow font-semibold"
                  : isDisabled
                  ? "text-aura-text-secondary/40 cursor-not-allowed hover:bg-transparent"
                  : "text-aura-text-secondary hover:text-aura-text-primary hover:bg-aura-surface-subtle"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Fixed Icon Container */}
                <span
                  className={cn(
                    "sidebar-icon-pop flex items-center justify-center shrink-0 w-5 h-5 transition-colors",
                    isActive
                      ? "text-aura-primary"
                      : isDisabled
                      ? "text-aura-text-secondary/40"
                      : "text-aura-text-secondary group-hover:text-aura-text-primary"
                  )}
                >
                  {getNavIcon(item.id)}
                </span>

                {/* Text Label: Disappears cleanly when collapsed */}
                <span
                  className={cn(
                    "transition-all duration-300 whitespace-nowrap overflow-hidden text-left",
                    isCollapsed ? "opacity-0 max-w-0 -translate-x-2" : "opacity-100 max-w-[140px] translate-x-0"
                  )}
                >
                  {item.label}
                </span>
              </div>

              {/* Badge: hidden when collapsed */}
              {!isCollapsed && item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-aura-surface-subtle text-aura-text-secondary font-mono border border-aura-border shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Hardware Connection, Logout & Status Footer ── */}
      <div className={cn("space-y-3 bg-aura-surface transition-all duration-300 border-t border-aura-border/50", isCollapsed ? "p-2.5" : "p-4")}>
        {/* Expanded Mode: Full Hardware Status Card */}
        {!isCollapsed ? (
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

            {/* Sync Trigger */}
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
        ) : (
          /* Collapsed Mode: Compact Beacon Indicator */
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              className="relative p-2.5 rounded-xl bg-aura-surface-subtle border border-aura-border flex items-center justify-center cursor-pointer group"
              title={isEspOnline ? "ESP32 Core: Online" : "ESP32 Core: Offline"}
              onClick={onRefresh}
            >
              <Radio className={cn("w-4 h-4", isEspOnline ? "text-aura-primary" : "text-red-500")} />
              <span
                className={cn(
                  "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-aura-surface",
                  isEspOnline ? "bg-aura-primary animate-pulse" : "bg-red-500"
                )}
              />
            </div>
          </div>
        )}

        {/* ── Logout Button ── */}
        {onLogout && (
          <button
            onClick={onLogout}
            title={isCollapsed ? "Keluar Sistem" : undefined}
            className={cn(
              "w-full flex items-center rounded-xl text-xs font-medium text-aura-text-secondary hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all duration-150 cursor-pointer group",
              isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LogOut className="w-4 h-4 text-aura-text-secondary group-hover:text-red-400 transition-colors shrink-0" />
              <span
                className={cn(
                  "transition-all duration-300 whitespace-nowrap overflow-hidden",
                  isCollapsed ? "opacity-0 max-w-0 -translate-x-2" : "opacity-100 max-w-[140px] translate-x-0"
                )}
              >
                Keluar Sistem
              </span>
            </div>
            {!isCollapsed && (
              <span className="text-[10px] text-aura-text-secondary/60 group-hover:text-red-400/80 font-mono">
                Log out
              </span>
            )}
          </button>
        )}

        {/* Version info: Only shown when expanded */}
        {!isCollapsed && (
          <div className="flex items-center justify-between px-1 text-[10px] text-aura-text-secondary/70 font-mono">
            <span>{APP_CONFIG.version}</span>
            <span>ESP32-WROOM</span>
          </div>
        )}
      </div>
    </aside>
  );
};
