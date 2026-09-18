import React from "react";
import { Lightbulb, Fan, Sliders, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActuatorControlProps {
  ledOn: boolean;
  aeratorOn: boolean;
  onToggleLed: () => void;
  onToggleAerator: () => void;
  mode?: "manual" | "iot";
  onToggleMode?: () => void;
  disabled?: boolean;
}

export const ActuatorControl: React.FC<ActuatorControlProps> = ({
  ledOn,
  aeratorOn,
  onToggleLed,
  onToggleAerator,
  mode = "iot",
  onToggleMode,
  disabled = false,
}) => {
  const isManual = mode === "manual";

  return (
    <div className="flex flex-col bg-aura-surface border border-aura-border rounded-2xl p-6 shadow-sm justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center text-aura-primary">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-aura-text-primary tracking-tight">
                Quick Actuator Controls
              </h2>
              <span className="text-[11px] text-aura-text-secondary">
                Kontrol langsung relai aktuator fisik bioreaktor
              </span>
            </div>
          </div>

          {/* Mode Switcher Pill (V4) */}
          {onToggleMode ? (
            <button
              type="button"
              onClick={onToggleMode}
              disabled={disabled}
              title="Klik untuk mengganti Mode Kontrol (Manual vs IoT)"
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-colors duration-150 border cursor-pointer",
                isManual
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20"
                  : "bg-aura-surface-active text-aura-primary border-aura-primary/40 hover:bg-aura-primary/20 shadow-glow",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Zap className="w-3 h-3" />
              <span>{isManual ? "Mode: Manual (V4:0)" : "Mode: IoT (V4:1)"}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-aura-surface-active text-aura-primary text-[11px] font-mono border border-aura-primary/30">
              <Zap className="w-3 h-3 text-aura-primary" />
              Active Bus
            </span>
          )}
        </div>

        <p className="text-xs text-aura-text-secondary mb-3">
          {isManual
            ? "Mode Manual aktif: Kontrol berada pada tombol fisik hardware ESP32."
            : "Mode IoT aktif: Kontrol relai aktif melalui cloud Blynk."}
        </p>

        {isManual && (
          <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 font-mono">
            ⚠️ Mode Manual: Tombol antarmuka web disinkronkan dengan hardware (tanpa mengesampingkan tombol fisik).
          </div>
        )}

        {disabled && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-500 font-mono">
            ⚠️ ESP32 Offline: Aktuator dinonaktifkan demi perlindungan sistem.
          </div>
        )}

        {/* Actuators Grid */}
        <div className="space-y-3">
          {/* LED Grow Light Control */}
          <div
            className={cn(
              "p-4 rounded-xl border transition-all duration-200",
              ledOn
                ? "bg-aura-surface-active/50 border-aura-primary/40 shadow-glow"
                : "bg-aura-surface-subtle border-aura-border"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    ledOn
                      ? "bg-aura-primary text-white shadow-glow"
                      : "bg-aura-surface text-aura-text-secondary border border-aura-border"
                  )}
                >
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-aura-text-primary">
                      Grow Light LED
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase",
                        ledOn
                          ? "bg-aura-primary/20 text-aura-primary"
                          : "bg-aura-border/40 text-aura-text-secondary"
                      )}
                    >
                      {ledOn ? "ON" : "OFF"}
                    </span>
                  </div>
                  <span className="text-[11px] text-aura-text-secondary font-mono">
                    GPIO 18 · Relay CH1 (V2)
                  </span>
                </div>
              </div>

              {/* Physical-style Toggle Switch */}
              <button
                type="button"
                onClick={onToggleLed}
                disabled={disabled}
                aria-label="Toggle LED Grow Light"
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-primary",
                  disabled ? "opacity-50 cursor-not-allowed bg-aura-border" : "cursor-pointer",
                  ledOn ? "bg-aura-primary shadow-glow" : "bg-aura-border"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out",
                    ledOn ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Power metric row */}
            <div className="flex items-center justify-between text-[11px] text-aura-text-secondary mt-3 pt-2 border-t border-aura-border/50">
              <span>Konsumsi Daya: ~10 W</span>
              <span className="font-mono text-aura-primary">
                {ledOn ? "Full Spectrum Active" : disabled ? "Offline (Mati)" : "Standby (OFF)"}
              </span>
            </div>
          </div>

          {/* Aerator Pump Control */}
          <div
            className={cn(
              "p-4 rounded-xl border transition-all duration-200",
              aeratorOn
                ? "bg-aura-surface-active/50 border-aura-primary/40 shadow-glow"
                : "bg-aura-surface-subtle border-aura-border"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    aeratorOn
                      ? "bg-aura-primary text-white shadow-glow"
                      : "bg-aura-surface text-aura-text-secondary border border-aura-border"
                  )}
                >
                  <Fan className={cn("w-4 h-4", aeratorOn && "animate-spin")} style={{ animationDuration: "3s" }} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-aura-text-primary">
                      Aerator Venturi Pump
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase",
                        aeratorOn
                          ? "bg-aura-primary/20 text-aura-primary"
                          : "bg-aura-border/40 text-aura-text-secondary"
                      )}
                    >
                      {aeratorOn ? "ON" : "OFF"}
                    </span>
                  </div>
                  <span className="text-[11px] text-aura-text-secondary font-mono">
                    GPIO 19 · Relay CH2 (V3)
                  </span>
                </div>
              </div>

              {/* Physical-style Toggle Switch */}
              <button
                type="button"
                onClick={onToggleAerator}
                disabled={disabled}
                aria-label="Toggle Aerator Pump"
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-primary",
                  disabled ? "opacity-50 cursor-not-allowed bg-aura-border" : "cursor-pointer",
                  aeratorOn ? "bg-aura-primary shadow-glow" : "bg-aura-border"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out",
                    aeratorOn ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Aerator metric row */}
            <div className="flex items-center justify-between text-[11px] text-aura-text-secondary mt-3 pt-2 border-t border-aura-border/50">
              <span>Debit Sirkulasi: ~1.5 L/min</span>
              <span className="font-mono text-aura-primary">
                {aeratorOn ? "Continuous Aeration" : disabled ? "Offline (Mati)" : "Standby (OFF)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-[11px] text-aura-text-secondary flex items-center justify-between">
        <span>Blynk Datastreams: V2 (LED), V3 (AER), V4 (Mode)</span>
        <span className="text-aura-primary font-mono">Active HIGH Relay</span>
      </div>
    </div>
  );
};
