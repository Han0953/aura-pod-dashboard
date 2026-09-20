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
  Radio,
  RefreshCw,
  Settings,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { ViewId } from "@/types/navigation";
import { SystemNotification } from "@/types/notification";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  activeView: ViewId;
  lastUpdatedText: string;
  isEspOnline?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  notifications?: SystemNotification[];
  unreadNotificationCount?: number;
  onMarkAllAsRead?: () => void;
  onClearAllNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
  onNavigateToSettings?: () => void;
  onLogout?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeView,
  lastUpdatedText,
  isEspOnline = true,
  onRefresh,
  isRefreshing = false,
  notifications = [],
  unreadNotificationCount = 0,
  onMarkAllAsRead,
  onClearAllNotifications,
  onDeleteNotification,
  onNavigateToSettings,
  onLogout,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const bellRef = useRef<SVGSVGElement>(null);
  const notifSheetRef = useRef<HTMLDivElement>(null);
  const profileSheetRef = useRef<HTMLDivElement>(null);

  const getViewTitle = () => {
    switch (activeView) {
      case "overview":
        return "Overview";
      case "monitoring":
        return "Sensor Telemetry";
      case "device":
        return "Device Management";
      case "analytics":
        return "Analytics";
      case "assistant":
        return "AIRA";
      case "settings":
        return "Settings";
      default:
        return "AURA Pod";
    }
  };

  const openNotifications = () => {
    setShowNotificationsSheet(true);
    setShowProfileSheet(false);
    if (bellRef.current) {
      gsap.fromTo(
        bellRef.current,
        { rotation: -20 },
        { rotation: 0, duration: 0.4, ease: "elastic.out(1.2, 0.4)" }
      );
    }
  };

  const closeNotifications = () => {
    if (notifSheetRef.current) {
      gsap.to(notifSheetRef.current, {
        y: "100%",
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => setShowNotificationsSheet(false),
      });
    } else {
      setShowNotificationsSheet(false);
    }
  };

  const openProfile = () => {
    setShowProfileSheet(true);
    setShowNotificationsSheet(false);
  };

  const closeProfile = () => {
    if (profileSheetRef.current) {
      gsap.to(profileSheetRef.current, {
        y: "100%",
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => setShowProfileSheet(false),
      });
    } else {
      setShowProfileSheet(false);
    }
  };

  // Animate sheet opening
  useEffect(() => {
    if (showNotificationsSheet && notifSheetRef.current) {
      gsap.fromTo(
        notifSheetRef.current,
        { y: "100%" },
        { y: "0%", duration: 0.32, ease: "power3.out" }
      );
    }
  }, [showNotificationsSheet]);

  useEffect(() => {
    if (showProfileSheet && profileSheetRef.current) {
      gsap.fromTo(
        profileSheetRef.current,
        { y: "100%" },
        { y: "0%", duration: 0.32, ease: "power3.out" }
      );
    }
  }, [showProfileSheet]);

  const getSeverityIcon = (severity: SystemNotification["severity"]) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-aura-primary shrink-0" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-aura-surface/85 backdrop-blur-xl border-b border-aura-border/60 pt-safe transition-colors duration-200">
        <div className="h-16 px-4 flex items-center justify-between gap-3">
          {/* Brand & Subtitle / Online Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center p-1 shadow-glow shrink-0">
              <img
                src="/aura-pod-logo.svg"
                alt="AURA Pod"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-sm tracking-tight text-aura-text-primary uppercase truncate">
                  AURA POD
                </span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isEspOnline ? "bg-aura-primary animate-pulse shadow-glow" : "bg-red-500"
                  )}
                />
              </div>
              <span className="text-[10px] text-aura-text-secondary truncate font-mono">
                {getViewTitle()} &middot; {lastUpdatedText}
              </span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ganti Tema"
              className="w-9 h-9 rounded-full bg-aura-surface-subtle hover:bg-aura-surface-active border border-aura-border flex items-center justify-center text-aura-text-secondary hover:text-aura-text-primary transition-all active:scale-95"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-700" />
              )}
            </button>

            {/* Notifications Button with Pulse Badge */}
            <button
              type="button"
              onClick={openNotifications}
              aria-label="Notifikasi Sistem"
              className="w-9 h-9 rounded-full bg-aura-surface-subtle hover:bg-aura-surface-active border border-aura-border flex items-center justify-center text-aura-text-secondary hover:text-aura-text-primary transition-all relative active:scale-95"
            >
              <Bell ref={bellRef} className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold font-mono text-white flex items-center justify-center shadow-md animate-pulse">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Profile / Operator Avatar Button */}
            <button
              type="button"
              onClick={openProfile}
              aria-label="Menu Pengguna & Pengaturan"
              className="w-9 h-9 rounded-full bg-aura-surface-active border border-aura-primary/40 flex items-center justify-center overflow-hidden transition-all active:scale-95 shadow-sm"
            >
              <img
                src="/aira.webp"
                alt="Operator"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <User className="w-4 h-4 text-aura-primary" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE NOTIFICATIONS BOTTOM SHEET ── */}
      {showNotificationsSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="absolute inset-0"
            onClick={closeNotifications}
            aria-hidden="true"
          />
          <div
            ref={notifSheetRef}
            className="relative bg-aura-surface border-t border-aura-border rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl z-10 pb-safe"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-aura-border/80 mx-auto mt-3 mb-2" />

            {/* Header */}
            <div className="px-5 py-3 border-b border-aura-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-aura-text-primary">
                  Pemberitahuan Sistem
                </h3>
                {unreadNotificationCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-500/15 text-red-500 border border-red-500/30">
                    {unreadNotificationCount} Baru
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadNotificationCount > 0 && onMarkAllAsRead && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="p-1.5 rounded-lg text-aura-primary hover:bg-aura-surface-subtle text-xs flex items-center gap-1 font-medium"
                    title="Tandai semua dibaca"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Baca Semua</span>
                  </button>
                )}
                <button
                  onClick={closeNotifications}
                  className="w-8 h-8 rounded-full bg-aura-surface-subtle flex items-center justify-center text-aura-text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-aura-text-secondary text-sm">
                  <CheckCircle2 className="w-8 h-8 text-aura-primary mx-auto mb-2 opacity-60" />
                  <p>Tidak ada pemberitahuan baru.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-start gap-3 transition-colors",
                      n.read
                        ? "bg-aura-bg/60 border-aura-border/40 text-aura-text-secondary"
                        : "bg-aura-surface-active/30 border-aura-primary/30 text-aura-text-primary"
                    )}
                  >
                    {getSeverityIcon(n.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-heading font-semibold text-xs text-aura-text-primary truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-aura-text-secondary font-mono shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-aura-text-secondary mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    {onDeleteNotification && (
                      <button
                        onClick={() => onDeleteNotification(n.id)}
                        className="text-aura-text-secondary/60 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Clear All Footer */}
            {notifications.length > 0 && onClearAllNotifications && (
              <div className="p-3 border-t border-aura-border/60 bg-aura-bg/50">
                <button
                  onClick={onClearAllNotifications}
                  className="w-full py-2.5 rounded-xl bg-aura-surface-subtle hover:bg-aura-surface-active text-aura-text-secondary hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua Pemberitahuan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MOBILE PROFILE / SETTINGS BOTTOM SHEET ── */}
      {showProfileSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="absolute inset-0"
            onClick={closeProfile}
            aria-hidden="true"
          />
          <div
            ref={profileSheetRef}
            className="relative bg-aura-surface border-t border-aura-border rounded-t-3xl p-5 flex flex-col shadow-2xl z-10 pb-safe space-y-4"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-aura-border/80 mx-auto -mt-2 mb-1" />

            {/* User Profile Info */}
            <div className="flex items-center justify-between pb-3 border-b border-aura-border/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-aura-surface-active border-2 border-aura-primary/40 flex items-center justify-center overflow-hidden shadow-glow">
                  <img
                    src="/aira.webp"
                    alt="Rehan"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <User className="w-6 h-6 text-aura-primary" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-aura-text-primary">
                    Rehan
                  </h4>
                  <span className="text-xs text-aura-text-secondary flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-aura-primary" />
                    Bioreactor Lead Operator
                  </span>
                </div>
              </div>
              <button
                onClick={closeProfile}
                className="w-8 h-8 rounded-full bg-aura-surface-subtle flex items-center justify-center text-aura-text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hardware Status Strip */}
            <div className="p-3.5 rounded-2xl bg-aura-bg/70 border border-aura-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    isEspOnline ? "bg-aura-primary/15 text-aura-primary" : "bg-red-500/15 text-red-500"
                  )}
                >
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-heading font-semibold text-xs text-aura-text-primary block">
                    ESP32 Core Controller
                  </span>
                  <span className="text-[10px] text-aura-text-secondary font-mono">
                    {isEspOnline ? "Blynk IoT Connected" : "Disconnected"}
                  </span>
                </div>
              </div>

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 rounded-xl bg-aura-surface hover:bg-aura-surface-subtle border border-aura-border text-xs text-aura-primary flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 font-medium"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                  <span>{isRefreshing ? "Sinkron..." : "Sync"}</span>
                </button>
              )}
            </div>

            {/* Action Links */}
            <div className="space-y-2 pt-1">
              {onNavigateToSettings && (
                <button
                  onClick={() => {
                    closeProfile();
                    onNavigateToSettings();
                  }}
                  className="w-full p-3.5 rounded-xl bg-aura-surface-subtle hover:bg-aura-surface-active border border-aura-border text-aura-text-primary text-sm font-semibold flex items-center gap-3 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-aura-surface flex items-center justify-center text-aura-text-secondary">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span>Pengaturan & Konfigurasi</span>
                    <span className="text-[11px] text-aura-text-secondary block font-normal">
                      Batas sensor, tema visual, & parameter IoT
                    </span>
                  </div>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    closeProfile();
                    onLogout();
                  }}
                  className="w-full p-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold flex items-center gap-3 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>Keluar dari Sistem</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
