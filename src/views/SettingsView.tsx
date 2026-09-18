import React, { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  Settings,
  Sun,
  Moon,
  Shield,
  Cpu,
  Sliders,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { DashboardContextType } from "@/services/dashboardService";
import { useTheme } from "@/context/ThemeContext";
import { StatusBadge } from "@/components/common/StatusBadge";
import { APP_CONFIG, SENSOR_THRESHOLDS, INITIAL_PIN_MAPPINGS } from "@/lib/constants";
import { ViewId } from "@/types/navigation";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  dashboard: DashboardContextType;
  onViewChange?: (view: ViewId) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ dashboard, onViewChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const {
    deviceStatus,
    diagnostics,
    clearAllNotifications,
    notifications,
    isBlynkConfigured,
  } = dashboard;

  const [clearNotifSuccess, setClearNotifSuccess] = useState(false);
  const [resetPrefSuccess, setResetPrefSuccess] = useState(false);

  // GSAP Staggered Entrance Animation (scoped & clean)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".settings-stagger-card", { opacity: 0, y: 28, scale: 0.98 });
      gsap.to(".settings-stagger-card", {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.08,
        delay: 0.05,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleClearNotifications = () => {
    clearAllNotifications();
    setClearNotifSuccess(true);
    setTimeout(() => setClearNotifSuccess(false), 2500);
  };

  const handleResetPreferences = () => {
    try {
      localStorage.removeItem("aura_active_view");
      localStorage.removeItem("aura_sidebar_collapsed");
    } catch {}
    setResetPrefSuccess(true);
    setTimeout(() => {
      setResetPrefSuccess(false);
      if (onViewChange) {
        onViewChange("overview");
      } else {
        window.location.reload();
      }
    }, 1200);
  };

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* ── Header Card ── */}
      <div className="settings-stagger-card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-aura-surface border border-aura-border rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-aura-surface-active text-aura-primary border border-aura-primary/30">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="font-heading text-lg font-bold text-aura-text-primary tracking-tight">
              Settings &amp; System Configuration
            </h2>
            <StatusBadge variant={deviceStatus.online ? "online" : "offline"} />
          </div>
          <p className="text-xs text-aura-text-secondary mt-1 max-w-2xl">
            Konfigurasi tampilan visual, tinjau batas toleransi sensor firmware, pantau pemetaan pin IoT, dan kelola preferensi penyimpanan lokal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-aura-text-secondary px-2.5 py-1 rounded-lg bg-aura-surface-subtle border border-aura-border">
            Build: {APP_CONFIG.version}
          </span>
        </div>
      </div>

      {/* ── Section 1: Appearance & Theme ── */}
      <div className="settings-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-aura-surface-subtle text-aura-text-primary border border-aura-border">
            <Sliders className="w-4 h-4" />
          </span>
          <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
            Appearance &amp; Color Scheme
          </h3>
        </div>
        <p className="text-xs text-aura-text-secondary mb-5">
          Pilih antara mode gelap OLED hemat daya atau mode terang kontras tinggi. Pengaturan tersimpan otomatis di peramban.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dark Theme Option */}
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "p-4 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer",
              isDark
                ? "bg-aura-surface-active/80 border-aura-primary shadow-glow"
                : "bg-aura-surface-subtle border-aura-border hover:border-aura-text-secondary/40"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-black text-aura-primary border border-aura-border">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-aura-text-primary flex items-center gap-2">
                  <span>OLED Obsidian Dark</span>
                  {isDark && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-aura-primary/10 text-aura-primary font-bold">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-aura-text-secondary mt-1 leading-relaxed">
                  Kanvas hitam pekat dengan aksen hijau emerald (#00E599). Dirancang untuk pemantauan lab minim cahaya dan efisiensi baterai.
                </p>
              </div>
            </div>
            {isDark && <Check className="w-4 h-4 text-aura-primary shrink-0 mt-0.5" />}
          </button>

          {/* Light Theme Option */}
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "p-4 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer",
              !isDark
                ? "bg-emerald-50/80 border-emerald-500 shadow-md"
                : "bg-aura-surface-subtle border-aura-border hover:border-aura-text-secondary/40"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-white text-emerald-600 border border-slate-200 shadow-sm">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-aura-text-primary flex items-center gap-2">
                  <span>Clean Slate Light</span>
                  {!isDark && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-aura-text-secondary mt-1 leading-relaxed">
                  Kanvas putih bersih (#F8FAFC) dengan teks emerald pekat. Suited untuk presentasi di siang hari dan pencetakan dokumen.
                </p>
              </div>
            </div>
            {!isDark && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
          </button>
        </div>
      </div>

      {/* ── Section 2: Sensor Thresholds & Alert Bounds ── */}
      <div className="settings-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-aura-surface-subtle text-aura-text-primary border border-aura-border">
              <Shield className="w-4 h-4" />
            </span>
            <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
              Photobiological Safety Thresholds
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-aura-surface-subtle border border-aura-border text-aura-text-secondary">
            Firmware Preset (Read-Only)
          </span>
        </div>
        <p className="text-xs text-aura-text-secondary mb-5">
          Batas toleransi keselamatan kultur mikroalga yang ditentukan pada firmware ESP32. Peringatan otomatis muncul bila melampaui batas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Temperature Range */}
          <div className="p-4 rounded-xl bg-aura-surface-subtle border border-aura-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-aura-text-primary">
                  Culture Temperature (DS18B20)
                </span>
                <span className="font-mono text-xs text-aura-primary font-bold">
                  {SENSOR_THRESHOLDS.temperature.toleranceStr}
                </span>
              </div>
              <p className="text-[11px] text-aura-text-secondary mt-1">
                Jendela pertumbuhan optimal untuk kultur mikroalga <i>Chlorella vulgaris</i>.
              </p>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-aura-text-secondary">
                <span>Min: {SENSOR_THRESHOLDS.temperature.min}°C</span>
                <span className="text-aura-primary font-bold">Optimal 22.0 – 26.0°C</span>
                <span>Max: {SENSOR_THRESHOLDS.temperature.max}°C</span>
              </div>
              <div className="h-2 w-full bg-aura-surface rounded-full overflow-hidden flex border border-aura-border">
                <div className="w-[28%] bg-aura-amber/60" title="Sub-optimal low" />
                <div className="w-[30%] bg-aura-primary shadow-glow" title="Optimal range" />
                <div className="w-[42%] bg-aura-amber/60" title="Sub-optimal high" />
              </div>
            </div>
          </div>

          {/* Gas Index Range */}
          <div className="p-4 rounded-xl bg-aura-surface-subtle border border-aura-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-aura-text-primary">
                  Headspace Gas Index (MQ-135)
                </span>
                <span className="font-mono text-xs text-aura-amber font-bold">
                  {SENSOR_THRESHOLDS.gasIndex.toleranceStr}
                </span>
              </div>
              <p className="text-[11px] text-aura-text-secondary mt-1">
                Metrik pertukaran gas/udara relatif (AQI Idx). Peringatan otomatis aktif jika melampaui 200 Idx.
              </p>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-aura-text-secondary">
                <span>Baseline: {SENSOR_THRESHOLDS.gasIndex.min}</span>
                <span className="text-aura-amber font-bold">Nominal 100 – 180 Idx</span>
                <span>Critical: {SENSOR_THRESHOLDS.gasIndex.max}</span>
              </div>
              <div className="h-2 w-full bg-aura-surface rounded-full overflow-hidden flex border border-aura-border">
                <div className="w-[20%] bg-aura-surface-subtle" />
                <div className="w-[35%] bg-aura-primary/70" />
                <div className="w-[25%] bg-aura-amber" />
                <div className="w-[20%] bg-red-500/70" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Device Diagnostics & Blynk Pin Mapping ── */}
      <div className="settings-stagger-card bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-aura-surface-subtle text-aura-text-primary border border-aura-border">
              <Cpu className="w-4 h-4" />
            </span>
            <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
              Device Identity &amp; Datastream Matrix
            </h3>
          </div>
          <span className="text-xs font-mono text-aura-text-secondary">
            {isBlynkConfigured ? "Blynk REST Terkonfigurasi" : "Mock Telemetry Mode"}
          </span>
        </div>
        <p className="text-xs text-aura-text-secondary mb-4">
          Spesifikasi perangkat keras dan tabel perutean pin GPIO fisik ke pin virtual Blynk untuk node prototype AURA Pod.
        </p>

        {/* Hardware Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs">
          <div className="p-3 rounded-xl bg-aura-surface-subtle border border-aura-border">
            <div className="text-aura-text-secondary text-[11px]">Device Identifier</div>
            <div className="font-mono font-bold text-aura-text-primary mt-1">{diagnostics.deviceId}</div>
          </div>
          <div className="p-3 rounded-xl bg-aura-surface-subtle border border-aura-border">
            <div className="text-aura-text-secondary text-[11px]">WiFi Network (SSID)</div>
            <div className="font-mono font-bold text-aura-text-primary mt-1">{diagnostics.wifiSsid}</div>
          </div>
          <div className="p-3 rounded-xl bg-aura-surface-subtle border border-aura-border">
            <div className="text-aura-text-secondary text-[11px]">Local IP Address</div>
            <div className="font-mono font-bold text-aura-text-primary mt-1">{diagnostics.ipAddress}</div>
          </div>
          <div className="p-3 rounded-xl bg-aura-surface-subtle border border-aura-border">
            <div className="text-aura-text-secondary text-[11px]">MCU Clock &amp; Heap</div>
            <div className="font-mono font-bold text-aura-text-primary mt-1">
              {diagnostics.cpuFrequencyMhz}MHz / {diagnostics.freeHeapKb}KB
            </div>
          </div>
        </div>

        {/* Virtual Pin Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-aura-border text-aura-text-secondary">
                <th className="py-2 px-3 font-semibold font-mono">Pin</th>
                <th className="py-2 px-3 font-semibold">Hardware GPIO</th>
                <th className="py-2 px-3 font-semibold">Assigned Component</th>
                <th className="py-2 px-3 font-semibold">Direction</th>
                <th className="py-2 px-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border/50">
              {INITIAL_PIN_MAPPINGS.map((pin) => (
                <tr key={pin.virtualPin} className="hover:bg-aura-surface-subtle/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-aura-primary">{pin.virtualPin}</td>
                  <td className="py-2.5 px-3 font-mono text-aura-text-secondary">{pin.hardwarePin}</td>
                  <td className="py-2.5 px-3 text-aura-text-primary font-medium">{pin.sensorOrActuator}</td>
                  <td className="py-2.5 px-3 text-aura-text-secondary text-[11px]">{pin.direction}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-aura-surface-active text-aura-primary border border-aura-primary/30">
                      {pin.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 4: Data Management & Danger Zone ── */}
      <div className="settings-stagger-card bg-aura-surface border border-red-500/20 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-red-400">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
            Data Management &amp; Storage Preferences
          </h3>
        </div>
        <p className="text-xs text-aura-text-secondary mb-4">
          Tindakan di bawah ini mengelola cache memori peramban lokal dan buffer notifikasi. Digunakan untuk mereset lingkungan pengujian.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Clear Notifications */}
          <div className="p-4 rounded-xl bg-aura-surface-subtle border border-aura-border flex flex-col justify-between">
            <div>
              <div className="font-semibold text-xs text-aura-text-primary flex items-center justify-between">
                <span>Clear Event &amp; Notification History</span>
                <span className="text-[10px] font-mono text-aura-text-secondary">
                  {notifications.length} item
                </span>
              </div>
              <p className="text-[11px] text-aura-text-secondary mt-1">
                Menghapus seluruh riwayat notifikasi peringatan dari bilah atas dan tabel analitik.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearNotifications}
              className={cn(
                "mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                clearNotifSuccess
                  ? "bg-aura-primary/20 text-aura-primary border-aura-primary"
                  : "bg-aura-surface text-aura-text-secondary hover:text-red-400 hover:border-red-500/40 border-aura-border"
              )}
            >
              {clearNotifSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-aura-primary" />
                  <span>Riwayat Notifikasi Dibersihkan!</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Notifications</span>
                </>
              )}
            </button>
          </div>

          {/* Reset View Preferences */}
          <div className="p-4 rounded-xl bg-aura-surface-subtle border border-aura-border flex flex-col justify-between">
            <div>
              <div className="font-semibold text-xs text-aura-text-primary flex items-center justify-between">
                <span>Reset View Preferences</span>
                <span className="text-[10px] font-mono text-aura-text-secondary">
                  localStorage
                </span>
              </div>
              <p className="text-[11px] text-aura-text-secondary mt-1">
                Menghapus tab aktif dan status sidebar yang tersimpan di memori lokal, mengembalikan tata letak standar pabrik.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetPreferences}
              className={cn(
                "mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                resetPrefSuccess
                  ? "bg-aura-primary/20 text-aura-primary border-aura-primary"
                  : "bg-aura-surface text-aura-text-secondary hover:text-aura-primary hover:border-aura-primary/40 border-aura-border"
              )}
            >
              {resetPrefSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-aura-primary" />
                  <span>Preferensi Tampilan Direset!</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset UI Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
