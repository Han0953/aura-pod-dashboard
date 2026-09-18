import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
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
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("aura_sidebar_collapsed");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const sidebarRef = useRef<HTMLElement>(null);
  const isFirstMount = useRef(true);
  const hasAnimatedEntrance = useRef(false);

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("aura_sidebar_collapsed", JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  // GSAP animation on collapse toggle (Silky fluid wave for ALL icons and nav items)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Keep icon transform strictly fixed (zero x/y jitter or horizontal bounce)
    gsap.set(".sidebar-nav-icon", { x: 0, y: 0 });

    // 3. Smooth vertical glide on navigation items & Core Navigation title
    if (!isCollapsed) {
      // Opening: Navigation items smoothly glide DOWNWARDS to accommodate the Core Navigation title
      gsap.fromTo(
        ".sidebar-item-wave",
        { y: -20 },
        { y: 0, duration: 0.32, ease: "power2.out" }
      );

      // Core Navigation title smoothly slides down and fades in
      gsap.fromTo(
        ".sidebar-section-title",
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );

      // Staggered slide-in of labels and badges
      gsap.fromTo(
        ".sidebar-nav-label",
        { x: -14, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.32, stagger: 0.02, ease: "power2.out" }
      );
      gsap.fromTo(
        ".sidebar-nav-badge",
        { opacity: 0 },
        { opacity: 1, duration: 0.25, stagger: 0.02, delay: 0.08, ease: "power2.out" }
      );
    } else {
      // Closing: Navigation items smoothly glide UPWARDS as Core Navigation title collapses
      gsap.fromTo(
        ".sidebar-item-wave",
        { y: 20 },
        { y: 0, duration: 0.32, ease: "power2.out" }
      );

      // Core Navigation title smoothly slides up and fades out
      gsap.to(".sidebar-section-title", {
        opacity: 0,
        y: -8,
        duration: 0.2,
        ease: "power2.in",
      });

      // Smooth slide-out of labels and badges
      gsap.to(".sidebar-nav-label", {
        x: -10,
        opacity: 0,
        duration: 0.18,
        stagger: 0.015,
        ease: "power2.in",
      });
      gsap.to(".sidebar-nav-badge", {
        opacity: 0,
        duration: 0.15,
        ease: "power2.in",
      });
    }
  }, [isCollapsed]);

  // GSAP Grand Entrance Wave (runs strictly once before first paint)
  useLayoutEffect(() => {
    if (!isEntrance || !sidebarRef.current || hasAnimatedEntrance.current) return;
    hasAnimatedEntrance.current = true;

    gsap.fromTo(
      sidebarRef.current,
      { xPercent: -100, opacity: 0 },
      {
        xPercent: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        clearProps: "transform,opacity",
      }
    );

    gsap.fromTo(
      ".sidebar-item-wave",
      { opacity: 0, x: -16 },
      {
        opacity: 1,
        x: 0,
        duration: 0.35,
        stagger: 0.05,
        delay: 0.2,
        ease: "power2.out",
        clearProps: "transform,opacity",
      }
    );
  }, []);

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
        "h-screen bg-aura-surface border-r border-aura-border flex flex-col justify-between shrink-0 select-none z-30 transition-[width] duration-300 ease-in-out relative",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* ── Brand Header (Fixed 80px Height) ── */}
      <div className="relative h-20 px-3.5 border-b border-aura-border/50 flex items-center shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Logo Box: When collapsed, the logo ITSELF is the toggle button! */}
          {isCollapsed ? (
            <button
              onClick={toggleCollapse}
              className="sidebar-nav-icon w-11 h-11 rounded-xl bg-aura-surface-active border border-aura-primary/40 hover:border-aura-primary flex items-center justify-center p-1.5 shadow-glow hover:shadow-[0_0_16px_rgba(45,212,191,0.4)] shrink-0 will-change-transform cursor-pointer transition-all group relative"
              title="Buka Sidebar"
            >
              <img
                src="/aura-pod-logo.svg"
                alt="AURA Pod - Klik untuk Buka Sidebar"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
              {/* Expand hint indicator on hover */}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-aura-primary text-aura-bg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <ChevronRight className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            </button>
          ) : (
            <button
              onClick={() => onViewChange("overview")}
              className="sidebar-nav-icon w-11 h-11 rounded-xl bg-aura-surface-active border border-aura-primary/30 hover:border-aura-primary/60 flex items-center justify-center p-1.5 shadow-glow shrink-0 will-change-transform cursor-pointer transition-colors"
              title="AURA Pod - Ke Overview"
            >
              <img
                src="/aura-pod-logo.svg"
                alt="AURA Pod"
                className="w-full h-full object-contain"
              />
            </button>
          )}

          {/* Brand Texts & Toggle Button (When open, toggle button appears beside the text) */}
          <div
            className={cn(
              "flex items-center justify-between transition-[opacity,max-width] duration-300 overflow-hidden flex-1 min-w-0",
              isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[180px]"
            )}
          >
            <div className="flex flex-col whitespace-nowrap overflow-hidden min-w-0">
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

            {/* Close Toggle Button: Beside the AURA Pod text when opened */}
            <button
              onClick={toggleCollapse}
              className="w-7 h-7 rounded-lg bg-aura-surface-subtle hover:bg-aura-surface-active border border-aura-border hover:border-aura-primary/40 flex items-center justify-center text-aura-text-secondary hover:text-aura-primary transition-colors cursor-pointer shrink-0 ml-1.5"
              title="Tutup Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Navigation Links ── */}
      <div className="flex-1 py-4 px-3.5 overflow-y-auto space-y-1.5 overflow-x-hidden">
        <div
          className={cn(
            "sidebar-section-title text-[10px] font-semibold uppercase tracking-wider text-aura-text-secondary overflow-hidden whitespace-nowrap px-1",
            isCollapsed ? "opacity-0 max-w-0 h-0 my-0 py-0 pointer-events-none" : "opacity-100 max-w-full h-5 my-0.5"
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
                "sidebar-item-wave h-11 flex items-center justify-start rounded-xl text-sm font-medium transition-colors duration-150 group cursor-pointer relative overflow-hidden border",
                isCollapsed ? "w-11" : "w-full",
                isActive
                  ? "sidebar-item-active bg-aura-surface-active text-aura-primary border-aura-primary/40 shadow-glow font-semibold"
                  : isDisabled
                  ? "text-aura-text-secondary/40 cursor-not-allowed hover:bg-transparent border-transparent"
                  : "text-aura-text-secondary hover:text-aura-text-primary hover:bg-aura-surface-subtle border-transparent"
              )}
            >
              {/* Fixed Icon Wrapper: with sidebar-nav-icon for GSAP micro-float */}
              <span className="sidebar-nav-icon w-11 h-11 flex items-center justify-center shrink-0 will-change-transform">
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
              </span>

              {/* Text Label: with sidebar-nav-label for GSAP slide-and-fade */}
              <span
                className={cn(
                  "sidebar-nav-label transition-[opacity,max-width] duration-300 whitespace-nowrap overflow-hidden text-left font-medium ml-1",
                  isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[125px]"
                )}
              >
                {item.label}
              </span>

              {/* Badge: with sidebar-nav-badge for GSAP scale-in */}
              {!isCollapsed && item.badge && (
                <span className="sidebar-nav-badge ml-auto mr-2 text-[10px] px-1.5 py-0.5 rounded-full bg-aura-surface-subtle text-aura-text-secondary font-mono border border-aura-border shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Hardware Connection, Logout & Status Footer ── */}
      <div className="px-3.5 py-3 space-y-2 bg-aura-surface border-t border-aura-border/50 shrink-0">
        {/* ESP32 Hardware Status - Persistent Animated Container */}
        <div
          className={cn(
            "rounded-xl border transition-all duration-300 overflow-hidden",
            isCollapsed
              ? "p-0 bg-transparent border-transparent"
              : "p-3 bg-aura-surface-subtle/50 border-aura-border/60 space-y-2"
          )}
        >
          {/* Top row: Fixed Radio icon button & collapsible status texts */}
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Radio Icon: Always persistent with sidebar-nav-icon for GSAP animation */}
              <button
                onClick={onRefresh}
                className={cn(
                  "sidebar-nav-icon w-11 h-11 rounded-xl flex items-center justify-center relative cursor-pointer transition-colors shrink-0 will-change-transform",
                  isCollapsed
                    ? "bg-aura-surface-subtle border border-aura-border hover:bg-aura-surface-active shadow-sm"
                    : "bg-transparent border-none p-0"
                )}
                title={isEspOnline ? "ESP32 Core: Online (Klik untuk sinkronisasi)" : "ESP32 Core: Offline"}
              >
                <Radio className={cn("w-4 h-4", isEspOnline ? "text-aura-primary" : "text-red-500")} />
                <span
                  className={cn(
                    "absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-aura-surface",
                    isEspOnline ? "bg-aura-primary animate-pulse" : "bg-red-500"
                  )}
                />
              </button>

              {/* Status title */}
              <span
                className={cn(
                  "text-xs font-semibold text-aura-text-primary transition-[opacity,max-width] duration-300 whitespace-nowrap overflow-hidden",
                  isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[90px]"
                )}
              >
                ESP32 Core
              </span>
            </div>

            {/* Pill Badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono transition-[opacity,max-width] duration-300 whitespace-nowrap overflow-hidden shrink-0",
                isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[80px]",
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

          {/* Subtitle & Sync Button: Smoothly collapsable */}
          <div
            className={cn(
              "transition-[opacity,max-height] duration-300 overflow-hidden space-y-2",
              isCollapsed ? "opacity-0 max-h-0 pointer-events-none" : "opacity-100 max-h-24 pt-1"
            )}
          >
            <div className="flex items-center justify-between text-[11px] text-aura-text-secondary pt-1 border-t border-aura-border/60">
              <span>Blynk IoT Protocol</span>
              <span className="font-mono text-[10px] text-aura-primary">Ready</span>
            </div>

            {/* Sync Trigger */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-full mt-1 py-1 px-2 rounded-md bg-aura-surface-subtle hover:bg-aura-border/40 text-[10px] text-aura-text-secondary hover:text-aura-text-primary flex items-center justify-center gap-1.5 transition-colors border border-aura-border cursor-pointer disabled:opacity-50"
              title="Sinkronkan status telemetri perangkat dengan Blynk Cloud"
            >
              <RefreshCw className={cn("w-3 h-3 text-aura-primary", isRefreshing && "animate-spin")} />
              <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronkan Blynk"}</span>
            </button>
          </div>
        </div>

        {/* ── Logout Button (Animated with sidebar-nav-icon) ── */}
        {onLogout && (
          <button
            onClick={onLogout}
            title={isCollapsed ? "Keluar Sistem" : undefined}
            className={cn(
              "h-11 flex items-center justify-start rounded-xl text-xs font-medium text-aura-text-secondary hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-colors duration-150 cursor-pointer group overflow-hidden",
              isCollapsed ? "w-11" : "w-full"
            )}
          >
            {/* Fixed Icon Slot with sidebar-nav-icon for GSAP animation */}
            <span className="sidebar-nav-icon w-11 h-11 flex items-center justify-center shrink-0 will-change-transform">
              <LogOut className="w-4 h-4 text-aura-text-secondary group-hover:text-red-400 transition-colors" />
            </span>

            {/* Label */}
            <span
              className={cn(
                "transition-[opacity,max-width] duration-300 whitespace-nowrap overflow-hidden font-medium ml-1",
                isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[130px]"
              )}
            >
              Keluar Sistem
            </span>
          </button>
        )}

        {/* Version info: Smooth collapse */}
        <div
          className={cn(
            "flex items-center justify-between px-1 text-[10px] text-aura-text-secondary/70 font-mono transition-[opacity,max-height] duration-300 overflow-hidden",
            isCollapsed ? "opacity-0 max-h-0 pointer-events-none" : "opacity-100 max-h-6 pt-1"
          )}
        >
          <span>{APP_CONFIG.version}</span>
          <span>ESP32-WROOM</span>
        </div>
      </div>
    </aside>
  );
};
