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

const NORMAL_TAB_IDS: ViewId[] = ["overview", "monitoring", "device", "analytics"];

export const MobileDockBar: React.FC<MobileDockBarProps> = ({
  activeView,
  onViewChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<{ [key in ViewId]?: HTMLButtonElement | null }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragHoverTab, setDragHoverTab] = useState<ViewId | null>(null);

  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const pendingTabRef = useRef<ViewId | null>(null);
  const isDraggingRef = useRef(false);
  const justDraggedRef = useRef(false);

  const isAiraActive = activeView === "assistant";
  // Tentukan tab mana yang disorot oleh pill (tab yang di-hover saat seret, atau activeView)
  const displayedView = isDragging && dragHoverTab ? dragHoverTab : activeView;
  const isAiraDisplayed = displayedView === "assistant";
  const isNormalTab = NORMAL_TAB_IDS.includes(displayedView);

  // Animasi posisi pill aktif di antara 4 tab normal dengan presisi DOM aktual (100% tepat di tengah icon)
  const updatePillPosition = useCallback(
    (immediate = false) => {
      if (!pillRef.current || !containerRef.current) return;

      if (isAiraDisplayed || !isNormalTab) {
        // Saat AIRA aktif, sembunyikan pill karena AIRA adalah floating orb terpisah
        gsap.to(pillRef.current, {
          opacity: 0,
          scale: 0.6,
          duration: 0.2,
          ease: "power2.in",
        });
        return;
      }

      const targetBtn = tabButtonRefs.current[displayedView];
      if (!targetBtn) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();
      // Hitung posisi tengah persis ikon relatif terhadap dock bar
      const targetPixelX = btnRect.left - containerRect.left + btnRect.width / 2 - 22;

      if (immediate) {
        gsap.set(pillRef.current, {
          opacity: 1,
          scale: 1,
          x: targetPixelX,
        });
      } else {
        gsap.to(pillRef.current, {
          opacity: 1,
          scale: 1,
          x: targetPixelX,
          duration: isDragging ? 0.12 : 0.28,
          ease: isDragging ? "power1.out" : "back.out(1.2)",
        });
      }
    },
    [displayedView, isAiraDisplayed, isNormalTab, isDragging]
  );

  useEffect(() => {
    updatePillPosition();
  }, [updatePillPosition]);

  // Update posisi pill saat window resize
  useEffect(() => {
    const handleResize = () => updatePillPosition(true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updatePillPosition]);

  // Touch Start: Simpan posisi awal sentuhan
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    pendingTabRef.current = null;
    isDraggingRef.current = false;
  };

  // Touch Move: Hanya aktif jika jari bergerak > 8px (seret).
  // PENTING: AIRA DILEWATKAN SEPENUHNYA SAAT DISERET! Seret hanya berpindah di antara 4 tab normal.
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !touchStartPosRef.current) return;
    const touch = e.touches[0];
    const moveDistanceX = Math.abs(touch.clientX - touchStartPosRef.current.x);

    // Hanya aktifkan mode seret jika pergeseran horizontal melebihi 8px
    if (moveDistanceX > 8 || isDraggingRef.current) {
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        justDraggedRef.current = true;
        setIsDragging(true);
      }

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = touch.clientX - rect.left;
      const clampedX = Math.max(0, Math.min(rect.width, relativeX));
      const ratio = clampedX / rect.width;

      // 4 Kuadran Tab Normal — AIRA DILEWATKAN SEPENUHNYA DARI SERETAN
      // Di posisi ujung (Overview & Analytics), rentang disesuaikan agar mentok pas di tengah ikon.
      let hovered: ViewId = "overview";
      if (ratio < 0.22) {
        hovered = "overview";
      } else if (ratio < 0.5) {
        hovered = "monitoring";
      } else if (ratio < 0.78) {
        hovered = "device";
      } else {
        hovered = "analytics";
      }

      if (pendingTabRef.current !== hovered) {
        pendingTabRef.current = hovered;
        setDragHoverTab(hovered);
        try {
          if ("vibrate" in navigator) {
            navigator.vibrate(8);
          }
        } catch {}
      }
    }
  }, []);

  // Touch End: Hanya jika ada seretan yang valid, buka tab yang dituju saat dilepas
  const handleTouchEnd = () => {
    if (isDraggingRef.current && pendingTabRef.current) {
      onViewChange(pendingTabRef.current);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragHoverTab(null);
    pendingTabRef.current = null;
    touchStartPosRef.current = null;

    // Beri jeda kecil agar event click bawaan browser tidak sengaja terpicu
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 150);
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
          className="relative w-full h-[64px] flex items-center justify-between backdrop-blur-2xl rounded-3xl"
        >
          {/* SVG Sculpted Background: Semi Transparan, Blur Bersih, Tanpa Bayangan Gelap */}
          <svg
            viewBox="0 0 360 64"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
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
              className="fill-aura-surface/45 stroke-aura-border/40"
              strokeWidth="1.2"
            />
          </svg>

          {/* Sliding Glow Pill Indicator (Hanya aktif untuk 4 tab samping) */}
          <div
            ref={pillRef}
            className={cn(
              "absolute top-[10px] w-[44px] h-[44px] rounded-full pointer-events-none bg-aura-surface-active/80 border border-aura-primary/40 shadow-glow transition-transform duration-150",
              isDragging && "scale-110 shadow-[0_0_16px_rgba(0,229,153,0.35)]"
            )}
          />

          {/* ── SISI KIRI: Overview & Monitoring ── */}
          <div className="flex items-center justify-around w-[130px] z-10 pl-1">
            <button
              ref={(el) => {
                tabButtonRefs.current["overview"] = el;
              }}
              type="button"
              onClick={() => {
                if (!justDraggedRef.current && !isDraggingRef.current) {
                  onViewChange("overview");
                }
              }}
              aria-label="Overview"
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none",
                displayedView === "overview"
                  ? "text-aura-primary scale-110 font-bold"
                  : "text-aura-text-secondary hover:text-aura-text-primary"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>

            <button
              ref={(el) => {
                tabButtonRefs.current["monitoring"] = el;
              }}
              type="button"
              onClick={() => {
                if (!justDraggedRef.current && !isDraggingRef.current) {
                  onViewChange("monitoring");
                }
              }}
              aria-label="Telemetry"
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none",
                displayedView === "monitoring"
                  ? "text-aura-primary scale-110 font-bold"
                  : "text-aura-text-secondary hover:text-aura-text-primary"
              )}
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>

          {/* ── PUSAT (TENGAH): AIRA FLOATING ORB (HANYA BISA DIBUKA DENGAN KLIK LANGSUNG) ── */}
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 -top-4 z-20 flex flex-col items-center",
              isDragging ? "pointer-events-none" : "pointer-events-auto"
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (justDraggedRef.current || isDraggingRef.current) {
                  return;
                }
                onViewChange("assistant");
              }}
              aria-label="AIRA Assistant"
              className="relative group focus:outline-none active:scale-90 transition-transform cursor-pointer"
            >
              {/* Floating Orb Circle */}
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative",
                  isAiraActive
                    ? "bg-gradient-to-tr from-aura-primary via-emerald-400 to-aura-cyan text-black shadow-[0_0_20px_rgba(0,229,153,0.5)] scale-110"
                    : "bg-aura-surface/85 backdrop-blur-xl border-2 border-aura-primary/50 text-aura-primary hover:border-aura-primary shadow-glow hover:scale-105"
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
              ref={(el) => {
                tabButtonRefs.current["device"] = el;
              }}
              type="button"
              onClick={() => {
                if (!justDraggedRef.current && !isDraggingRef.current) {
                  onViewChange("device");
                }
              }}
              aria-label="Device"
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none",
                displayedView === "device"
                  ? "text-aura-primary scale-110 font-bold"
                  : "text-aura-text-secondary hover:text-aura-text-primary"
              )}
            >
              <Cpu className="w-5 h-5" />
            </button>

            <button
              ref={(el) => {
                tabButtonRefs.current["analytics"] = el;
              }}
              type="button"
              onClick={() => {
                if (!justDraggedRef.current && !isDraggingRef.current) {
                  onViewChange("analytics");
                }
              }}
              aria-label="Analytics"
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none",
                displayedView === "analytics"
                  ? "text-aura-primary scale-110 font-bold"
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
