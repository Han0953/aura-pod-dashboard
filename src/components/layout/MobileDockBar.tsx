import React, { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import {
  LayoutDashboard,
  Activity,
  Cpu,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { ViewId } from "@/types/navigation";
import { cn } from "@/lib/utils";

interface MobileDockBarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

interface NormalTab {
  id: ViewId;
  label: string;
  icon: React.ReactNode;
  centerX: number; // Posisi X tengah dalam viewBox 360
}

// 4 Tab Standar (Tanpa AIRA yang berada di tengah sebagai floating orb)
const NORMAL_TABS: NormalTab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-5 h-5" />,
    centerX: 44,
  },
  {
    id: "monitoring",
    label: "Telemetry",
    icon: <Activity className="w-5 h-5" />,
    centerX: 104,
  },
  {
    id: "device",
    label: "Device",
    icon: <Cpu className="w-5 h-5" />,
    centerX: 256,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    centerX: 316,
  },
];

export const MobileDockBar: React.FC<MobileDockBarProps> = ({
  activeView,
  onViewChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isAiraActive = activeView === "assistant";
  const activeNormalIndex = NORMAL_TABS.findIndex((t) => t.id === activeView);

  // Animasi posisi pill aktif di antara 4 tab standar
  useEffect(() => {
    if (!pillRef.current || !containerRef.current) return;

    if (isAiraActive || activeNormalIndex === -1) {
      // Saat AIRA aktif, hilangkan pill dengan halus (karena AIRA adalah floating orb tersendiri)
      gsap.to(pillRef.current, {
        opacity: 0,
        scale: 0.6,
        duration: 0.22,
        ease: "power2.in",
      });
    } else {
      // Pindahkan pill ke posisi tab normal yang aktif
      const targetTab = NORMAL_TABS[activeNormalIndex];
      const containerWidth = containerRef.current.offsetWidth;
      // Konversi koordinat viewBox (360) ke pixel riil
      const targetPixelX = (targetTab.centerX / 360) * containerWidth - 22;

      gsap.to(pillRef.current, {
        opacity: 1,
        scale: 1,
        x: targetPixelX,
        duration: 0.32,
        ease: "back.out(1.4)",
      });
    }
  }, [activeView, isAiraActive, activeNormalIndex]);

  // Touch Scrubbing Handler (Menggeser jari di sepanjang dock bar)
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!containerRef.current || !pillRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = touch.clientX - rect.left;
      const clampedX = Math.max(0, Math.min(rect.width, relativeX));
      const ratio = clampedX / rect.width; // 0.0 - 1.0

      // Deteksi tab berdasarkan posisi jari
      if (ratio < 0.22) {
        // Tab 1: Overview
        if (activeView !== "overview") onViewChange("overview");
        gsap.set(pillRef.current, { x: (44 / 360) * rect.width - 22, opacity: 1, scale: 1 });
      } else if (ratio < 0.38) {
        // Tab 2: Monitoring
        if (activeView !== "monitoring") onViewChange("monitoring");
        gsap.set(pillRef.current, { x: (104 / 360) * rect.width - 22, opacity: 1, scale: 1 });
      } else if (ratio < 0.62) {
        // Area Tengah: AIRA Floating Orb!
        if (activeView !== "assistant") onViewChange("assistant");
        gsap.set(pillRef.current, { opacity: 0, scale: 0.6 });
      } else if (ratio < 0.78) {
        // Tab 3: Device
        if (activeView !== "device") onViewChange("device");
        gsap.set(pillRef.current, { x: (256 / 360) * rect.width - 22, opacity: 1, scale: 1 });
      } else {
        // Tab 4: Analytics
        if (activeView !== "analytics") onViewChange("analytics");
        gsap.set(pillRef.current, { x: (316 / 360) * rect.width - 22, opacity: 1, scale: 1 });
      }

      try {
        if ("vibrate" in navigator) {
          navigator.vibrate(8);
        }
      } catch {}
    },
    [activeView, onViewChange]
  );

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTouchMove(e);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none pb-safe">
      <div className="px-3 pb-3 pointer-events-auto max-w-[364px] mx-auto relative select-none touch-none">
        {/* ── 1. SCULPTED DOCK CONTAINER WITH CONCAVE AIRA CRADLE ── */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-[64px] flex items-center justify-between"
        >
          {/* SVG Sculpted Background dengan Lengkungan Cekung Khusus AIRA di Tengah */}
          <svg
            viewBox="0 0 360 64"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          >
            {/* 
              Jalur Geometri:
              - Sisi kiri atas flat (0 sampai 134)
              - Lengkungan cekung ke bawah untuk cradle AIRA (134 ke 226, kedalaman y=34)
              - Sisi kanan atas flat (226 sampai 360)
              - Sudut-sudut membulat halus (radius 24)
            */}
            <path
              d="M 24 0 
                 L 134 0 
                 C 148 0, 150 34, 180 34 
                 C 210 34, 212 0, 226 0 
                 L 336 0 
                 C 350 0, 360 10, 360 24 
                 L 360 40 
                 C 360 54, 350 64, 336 64 
                 L 24 64 
                 C 10 64, 0 54, 0 40 
                 L 0 24 
                 C 0 10, 10 0, 24 0 
                 Z"
              className="fill-aura-surface/90 stroke-aura-border/80"
              strokeWidth="1.2"
            />
          </svg>

          {/* Sliding Glow Pill Indicator (Hanya aktif untuk tab-tab samping) */}
          <div
            ref={pillRef}
            className={cn(
              "absolute top-[10px] w-[44px] h-[44px] rounded-full pointer-events-none bg-aura-surface-active border border-aura-primary/40 shadow-glow transition-transform duration-200",
              isDragging && "scale-110"
            )}
          />

          {/* ── SISI KIRI: Overview & Monitoring ── */}
          <div className="flex items-center justify-around w-[130px] z-10 pl-1">
            <button
              type="button"
              onClick={() => onViewChange("overview")}
              aria-label="Overview"
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none",
                activeView === "overview"
                  ? "text-aura-primary scale-110"
                  : "text-aura-text-secondary hover:text-aura-text-primary"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => onViewChange("monitoring")}
              aria-label="Telemetry"
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none",
                activeView === "monitoring"
                  ? "text-aura-primary scale-110"
                  : "text-aura-text-secondary hover:text-aura-text-primary"
              )}
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>

          {/* ── PUSAT (TENGAH): AIRA FLOATING ORB (DITOPANG LENGKUNGAN CEKUNG / DETACHED) ── */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-20 flex flex-col items-center">
            <button
              type="button"
              onClick={() => onViewChange("assistant")}
              aria-label="AIRA Assistant"
              className="relative group focus:outline-none active:scale-90 transition-transform"
            >
              {/* Floating Orb Circle */}
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-2xl",
                  isAiraActive
                    ? "bg-gradient-to-tr from-aura-primary via-emerald-400 to-aura-cyan text-black shadow-[0_0_20px_rgba(0,229,153,0.5)] scale-110"
                    : "bg-aura-surface border-2 border-aura-primary/50 text-aura-primary hover:border-aura-primary shadow-glow hover:scale-105"
                )}
              >
                {/* Pulsing ring aura saat aktif */}
                {isAiraActive && (
                  <span className="absolute -inset-1.5 rounded-full border border-aura-primary/60 animate-ping opacity-60 pointer-events-none" />
                )}
                <Sparkles className={cn("w-6 h-6", isAiraActive ? "animate-pulse" : "")} />
              </div>
            </button>
          </div>

          {/* ── SISI KANAN: Device & Analytics ── */}
          <div className="flex items-center justify-around w-[130px] z-10 pr-1 ml-auto">
            <button
              type="button"
              onClick={() => onViewChange("device")}
              aria-label="Device"
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none",
                activeView === "device"
                  ? "text-aura-primary scale-110"
                  : "text-aura-text-secondary hover:text-aura-text-primary"
              )}
            >
              <Cpu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => onViewChange("analytics")}
              aria-label="Analytics"
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none",
                activeView === "analytics"
                  ? "text-aura-primary scale-110"
                  : "text-aura-text-secondary hover:text-aura-text-primary"
              )}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDockBar;
