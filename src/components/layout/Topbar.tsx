import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import {
  Bell,
  Sun,
  Moon,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Trash2,
  CheckCheck,
  X,
} from "lucide-react";
import { ViewId } from "@/types/navigation";
import { SystemNotification } from "@/types/notification";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface TopbarProps {
  activeView: ViewId;
  lastUpdatedText: string;
  notifications?: SystemNotification[];
  unreadNotificationCount?: number;
  onMarkAllAsRead?: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeView,
  lastUpdatedText,
  notifications = [],
  unreadNotificationCount = 0,
  onMarkAllAsRead,
  onClearAllNotifications,
  onDeleteNotification,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isNotifMounted, setIsNotifMounted] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const notifListRef = useRef<HTMLDivElement>(null);
  const emptyStateRef = useRef<HTMLDivElement>(null);
  const bellIconRef = useRef<SVGSVGElement>(null);
  const isAnimatingRef = useRef(false);

  const openPopover = () => {
    if (isNotifOpen || isAnimatingRef.current) return;
    setIsNotifMounted(true);
    setIsNotifOpen(true);

    if (bellIconRef.current) {
      gsap.fromTo(
        bellIconRef.current,
        { rotation: -22 },
        { rotation: 0, duration: 0.45, ease: "elastic.out(1.2, 0.35)" }
      );
    }
  };

  const closePopover = () => {
    if (!isNotifOpen || isAnimatingRef.current) return;
    setIsNotifOpen(false);

    if (popoverRef.current) {
      isAnimatingRef.current = true;
      gsap.to(popoverRef.current, {
        scale: 0.15,
        opacity: 0,
        y: -10,
        transformOrigin: "top right",
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => {
          setIsNotifMounted(false);
          isAnimatingRef.current = false;
        },
      });
    } else {
      setIsNotifMounted(false);
    }
  };

  const togglePopover = () => {
    if (isNotifOpen) {
      closePopover();
    } else {
      openPopover();
    }
  };

  // Entrance animation when popover mounts in DOM
  useEffect(() => {
    if (isNotifMounted && popoverRef.current) {
      isAnimatingRef.current = true;
      gsap.fromTo(
        popoverRef.current,
        {
          scale: 0.15,
          opacity: 0,
          y: -10,
          transformOrigin: "top right",
        },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.32,
          ease: "back.out(1.25)",
          onComplete: () => {
            isAnimatingRef.current = false;
          },
        }
      );
    }
  }, [isNotifMounted]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        closePopover();
      }
    }
    if (isNotifMounted) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifMounted, isNotifOpen]);

  // Smooth exit animation for Clear All (cascading wave swipe-out)
  const handleClearAll = () => {
    if (!onClearAllNotifications || isClearingAll) return;
    const cards = notifListRef.current?.querySelectorAll(".notif-card-item");
    if (!cards || cards.length === 0) {
      onClearAllNotifications();
      return;
    }

    setIsClearingAll(true);
    gsap.to(cards, {
      x: 45,
      opacity: 0,
      scale: 0.95,
      duration: 0.24,
      stagger: 0.035,
      ease: "power2.in",
      onComplete: () => {
        onClearAllNotifications();
        setIsClearingAll(false);
      },
    });
  };

  // Smooth exit animation for deleting an individual notification
  const handleDismissSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteNotification) return;

    const card = (e.currentTarget as HTMLElement).closest(".notif-card-item") as HTMLElement;
    if (card) {
      gsap.to(card, {
        x: 40,
        opacity: 0,
        scale: 0.94,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => {
          gsap.to(card, {
            height: 0,
            paddingTop: 0,
            paddingBottom: 0,
            marginTop: 0,
            marginBottom: 0,
            duration: 0.18,
            ease: "power2.out",
            onComplete: () => {
              onDeleteNotification(id);
            },
          });
        },
      });
    } else {
      onDeleteNotification(id);
    }
  };

  // Entrance animation for empty state when notifications are cleared
  useEffect(() => {
    if (notifications.length === 0 && emptyStateRef.current && isNotifMounted) {
      gsap.fromTo(
        emptyStateRef.current,
        { opacity: 0, scale: 0.92, y: 6 },
        { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: "back.out(1.4)" }
      );
    }
  }, [notifications.length, isNotifMounted]);

  const getHeaderInfo = () => {
    switch (activeView) {
      case "overview":
        return {
          title: "System Overview",
          subtitle: "Pemantauan telemetri langsung, pencahayaan fotoperiode, dan kesehatan kultur alga",
        };
      case "monitoring":
        return {
          title: "Sensor Telemetry & Trends",
          subtitle: "Analisis telemetri suhu DS18B20 dan indeks gas MQ-135 secara berkala",
        };
      case "device":
        return {
          title: "Device Management & Hardware Diagnostics",
          subtitle: "Diagnostik perangkat keras, status modul sensor, dan kontrol manual aktuator",
        };
      case "analytics":
        return {
          title: "Advanced Analytics",
          subtitle: "Agregasi statistik, korelasi sensor, dan pemodelan biologis kultur alga",
        };
      case "settings":
        return {
          title: "Settings & Configurations",
          subtitle: "Konfigurasi tampilan visual, batas toleransi sensor, dan parameter IoT",
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  const formatNotifTime = (timestamp: string) => {
    const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (isNaN(diffSec) || diffSec < 60) return "Baru saja";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}j lalu`;
    return new Date(timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const getSeverityIcon = (severity: SystemNotification["severity"]) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case "success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-aura-primary shrink-0" />;
      case "info":
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <header className="h-18 px-8 bg-aura-surface/75 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
      {/* Left: View Title & Subtitle */}
      <div id="topbar-title-block" className="flex flex-col py-3">
        <h1 className="font-heading text-lg font-bold text-aura-text-primary tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-aura-text-secondary truncate">{subtitle}</p>
      </div>

      {/* Right: Actions and Status indicators */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Icon Button with Smooth Morphing */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
          title={theme === "dark" ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
          className={cn(
            "p-2 rounded-lg border transition-all duration-200 shadow-sm cursor-pointer relative overflow-hidden group",
            theme === "dark"
              ? "bg-aura-surface-subtle border-aura-border text-amber-400 hover:bg-aura-border/40 hover:border-amber-400/40"
              : "bg-white border-aura-border text-emerald-700 hover:bg-aura-surface-subtle hover:border-emerald-600/30"
          )}
        >
          <div
            className={cn(
              "w-4 h-4 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              theme === "dark" ? "rotate-0 scale-100" : "rotate-[360deg] scale-100"
            )}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-700 transition-transform group-hover:-rotate-12 duration-300" />
            )}
          </div>
        </button>

        {/* Telemetry Sync Timestamp */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aura-surface-subtle border border-aura-border text-xs text-aura-text-secondary font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-aura-primary" />
          <span>Synced: {lastUpdatedText}</span>
        </div>

        {/* Interactive Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={togglePopover}
            aria-label="Buka Notifikasi"
            title="Notifikasi & Peringatan Sistem"
            className={cn(
              "relative p-2 rounded-lg border transition-colors duration-150 cursor-pointer",
              isNotifOpen
                ? "bg-aura-surface-active border-aura-primary/50 text-aura-primary shadow-glow"
                : "bg-aura-surface-subtle border-aura-border text-aura-text-secondary hover:text-aura-text-primary hover:border-aura-primary/30"
            )}
          >
            <Bell ref={bellIconRef} className="w-4 h-4 will-change-transform" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold font-mono text-white flex items-center justify-center shadow-md animate-pulse">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Card with Scale to/from Icon Animation */}
          {isNotifMounted && (
            <div
              ref={popoverRef}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-aura-surface/95 backdrop-blur-xl border border-aura-border shadow-2xl p-4 z-50 will-change-transform origin-top-right"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-aura-border/60">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm text-aura-text-primary">
                    Pemberitahuan Sistem
                  </span>
                  {unreadNotificationCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/15 text-red-500 border border-red-500/30">
                      {unreadNotificationCount} Baru
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadNotificationCount > 0 && onMarkAllAsRead && (
                    <button
                      type="button"
                      onClick={onMarkAllAsRead}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-aura-text-secondary hover:text-aura-primary hover:bg-aura-surface-subtle transition-colors cursor-pointer"
                      title="Tandai semua sudah dibaca"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Dibaca</span>
                    </button>
                  )}
                  {notifications.length > 0 && onClearAllNotifications && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={isClearingAll}
                      className="p-1 rounded-md text-aura-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                      title="Bersihkan semua notifikasi"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div ref={notifListRef} className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div ref={emptyStateRef} className="py-8 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-8 h-8 text-aura-primary/50 mb-2" />
                    <p className="font-semibold text-xs text-aura-text-primary">
                      Tidak Ada Notifikasi
                    </p>
                    <p className="text-[11px] text-aura-text-secondary mt-0.5">
                      Seluruh parameter kultur dan hardware dalam kondisi normal.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "notif-card-item p-3 rounded-xl border text-xs flex items-start gap-2.5 relative group/item overflow-hidden transition-colors",
                        notif.read
                          ? "bg-aura-surface-subtle/50 border-aura-border/60 text-aura-text-secondary"
                          : "bg-aura-surface-active/30 border-aura-primary/30 text-aura-text-primary shadow-sm"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">{getSeverityIcon(notif.severity)}</div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "font-semibold text-xs truncate",
                              notif.read ? "text-aura-text-primary/80" : "text-aura-text-primary"
                            )}
                          >
                            {notif.title}
                          </span>
                          <span className="text-[10px] font-mono text-aura-text-secondary/70 shrink-0">
                            {formatNotifTime(notif.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-aura-text-secondary mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Individual dismiss button with smooth swipe-out animation */}
                      {onDeleteNotification && (
                        <button
                          type="button"
                          onClick={(e) => handleDismissSingle(notif.id, e)}
                          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-md flex items-center justify-center text-aura-text-secondary/50 hover:text-red-400 hover:bg-red-500/15 opacity-60 group-hover/item:opacity-100 transition-all cursor-pointer"
                          title="Hapus notifikasi ini"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!notif.read && !onDeleteNotification && (
                        <span className="w-1.5 h-1.5 rounded-full bg-aura-primary shrink-0 mt-1.5 shadow-glow" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
