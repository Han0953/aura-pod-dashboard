import React from "react";
import { Leaf, TrendingUp, HelpCircle, Dna, AlertCircle } from "lucide-react";
import { CarbonMetric, BiomassMetric } from "@/types/mrv";

interface CarbonMetricCardProps {
  carbon: CarbonMetric;
  biomass: BiomassMetric;
}

export const CarbonMetricCard: React.FC<CarbonMetricCardProps> = ({
  carbon,
  biomass,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card 1: Estimated Carbon Capture */}
      <div className="bg-aura-surface border border-aura-border hover:border-aura-border-hover rounded-2xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between transition-all group">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center text-aura-primary shadow-glow shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
                  Carbon Sequestration
                </h3>
                <p className="text-[11px] text-aura-text-secondary mt-0.5">
                  Estimasi penyerapan gas CO₂
                </p>
              </div>
            </div>

            {/* Compact Prototype Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-medium border border-amber-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Prototype
            </span>
          </div>

          {/* Explicit Non-functional Notice Banner */}
          <div className="mb-4 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="leading-tight">
              <strong>Fitur Prototipe (Non-Fungsional):</strong> Belum terhubung sensor fisik & belum berfungsi saat ini.
            </span>
          </div>

          {/* Metric Value Display */}
          <div className="my-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-bold text-aura-text-primary tabular-nums tracking-tight font-mono">
                  {carbon.sequestrationDailyKg}
                </span>
                <span className="text-xs font-semibold text-aura-primary font-mono">
                  kg CO₂ / day
                </span>
              </div>
              <span className="text-[10px] font-mono text-aura-text-secondary">
                Model Stoikiometri
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-aura-surface-subtle h-2 rounded-full mt-3 overflow-hidden border border-aura-border">
              <div
                className="bg-gradient-to-r from-aura-primary-hover to-aura-primary h-full rounded-full shadow-glow"
                style={{ width: "68%" }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-aura-text-secondary mt-1.5">
              <span>Target: 2.70 kg/minggu</span>
              <span className="text-aura-primary font-semibold">68% Simulasi</span>
            </div>
          </div>
        </div>

        {/* Footer Info Row */}
        <div className="pt-3 mt-2 border-t border-aura-border flex items-center justify-between text-[11px] text-aura-text-secondary">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-aura-primary shrink-0" />
            <span>Rancangan Pengembangan Fase 2</span>
          </div>
          <div className="group relative cursor-help shrink-0">
            <HelpCircle className="w-3.5 h-3.5 text-aura-text-secondary hover:text-aura-text-primary transition-colors" />
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col w-60 p-2.5 rounded-xl bg-aura-surface border border-aura-border text-[11px] text-aura-text-secondary shadow-xl z-50 leading-relaxed">
              Modul ini merupakan peragaan konsep visual Fase 2 dan belum beroperasi mengambil data fisik riil dari sensor pada prototype saat ini.
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Biomass Density & Growth */}
      <div className="bg-aura-surface border border-aura-border hover:border-aura-border-hover rounded-2xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between transition-all group">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-aura-cyan/10 border border-aura-cyan/30 flex items-center justify-center text-aura-cyan shadow-[0_0_12px_rgba(56,189,248,0.25)] shrink-0">
                <Dna className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
                  Biomass Cultivation
                </h3>
                <p className="text-[11px] text-aura-text-secondary mt-0.5">
                  Pertumbuhan kultur Chlorella sp.
                </p>
              </div>
            </div>

            {/* Compact Prototype Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-medium border border-amber-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Prototype
            </span>
          </div>

          {/* Explicit Non-functional Notice Banner */}
          <div className="mb-4 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="leading-tight">
              <strong>Fitur Prototipe (Non-Fungsional):</strong> Belum terhubung sensor fisik & belum berfungsi saat ini.
            </span>
          </div>

          {/* Metric Value Display */}
          <div className="my-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-bold text-aura-text-primary tabular-nums tracking-tight font-mono">
                  {biomass.dryBiomassDensityGPerL ?? 0.84}
                </span>
                <span className="text-xs font-semibold text-aura-cyan font-mono">
                  g / L (Dry Weight)
                </span>
              </div>
              <span className="text-[10px] font-mono text-aura-cyan font-medium">
                Fase Eksponensial
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-aura-surface-subtle h-2 rounded-full mt-3 overflow-hidden border border-aura-border">
              <div
                className="bg-gradient-to-r from-sky-500 to-aura-cyan h-full rounded-full shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                style={{ width: "62%" }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-aura-text-secondary mt-1.5">
              <span>Ambang Panen: 2.0 g/L</span>
              <span className="text-aura-cyan font-semibold">OD₆₈₀: {biomass.opticalDensity680 ?? 1.28}</span>
            </div>
          </div>
        </div>

        {/* Footer Info Row */}
        <div className="pt-3 mt-2 border-t border-aura-border flex items-center justify-between text-[11px] text-aura-text-secondary">
          <div className="flex items-center gap-1.5">
            <Dna className="w-3.5 h-3.5 text-aura-cyan shrink-0" />
            <span>Strain: Chlorella vulgaris</span>
          </div>
          <div className="group relative cursor-help shrink-0">
            <HelpCircle className="w-3.5 h-3.5 text-aura-text-secondary hover:text-aura-text-primary transition-colors" />
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col w-60 p-2.5 rounded-xl bg-aura-surface border border-aura-border text-[11px] text-aura-text-secondary shadow-xl z-50 leading-relaxed">
              Modul estimasi kerapatan biomassa ini adalah rancangan konsep Fase 2 dan belum terintegrasi ke sensor spektrofotometri fisik pada prototype saat ini.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
