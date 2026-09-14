import React from "react";
import { Leaf, TrendingUp, HelpCircle, Dna } from "lucide-react";
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
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-aura-surface-active border border-aura-primary/30 flex items-center justify-center text-aura-primary shadow-glow">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
                  Carbon Sequestration (Est.)
                </h3>
                <span className="text-[10px] text-aura-text-secondary font-mono">
                  MRV Protocol Preview
                </span>
              </div>
            </div>

            {/* Mandatory Prototype / Estimated badge per PRD.md */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-aura-amber text-[10px] font-mono border border-aura-amber/30">
              Estimated / Prototype
            </span>
          </div>

          {/* Metric display */}
          <div className="mt-4 mb-2">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold text-aura-text-primary tabular-nums tracking-tight">
                {carbon.sequestrationDailyKg}
              </span>
              <span className="text-sm font-medium text-aura-primary">
                kg CO₂ / day
              </span>
            </div>

            {/* Progress bar towards weekly capture goal */}
            <div className="w-full bg-aura-surface-subtle h-2 rounded-full mt-3 overflow-hidden border border-aura-border">
              <div
                className="bg-gradient-to-r from-aura-primary-hover to-aura-primary h-full rounded-full shadow-glow transition-all duration-500"
                style={{ width: "68%" }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-aura-text-secondary mt-1.5">
              <span>Weekly Target: 2.70 kg</span>
              <span className="text-aura-primary font-semibold">68% Achieved</span>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="pt-3 border-t border-aura-border flex items-center justify-between text-[11px] text-aura-text-secondary">
          <div className="flex items-center gap-1.5 truncate">
            <TrendingUp className="w-3.5 h-3.5 text-aura-primary shrink-0" />
            <span className="truncate">Model: Stoichiometric photosynthesis estimate</span>
          </div>
          <div className="group relative cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-aura-text-secondary hover:text-aura-text-primary" />
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col w-52 p-2.5 rounded-lg bg-aura-surface border border-aura-border text-[10px] text-aura-text-secondary shadow-xl z-50">
              Estimasi kuantifikasi karbon dihitung dari estimasi laju pertumbuhan biomassa. Sesuai PRD, angka ini tidak diklaim sebagai pengukuran fisik absolut.
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Biomass Density & Optical Absorption */}
      <div className="bg-aura-surface border border-aura-border hover:border-aura-border-hover rounded-2xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between transition-all group">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-aura-cyan/10 border border-aura-cyan/30 flex items-center justify-center text-aura-cyan shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                <Dna className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-aura-text-primary tracking-tight">
                  Biomass Density & Growth
                </h3>
                <span className="text-[10px] text-aura-text-secondary font-mono">
                  Chlorella vulgaris Strain
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-aura-cyan text-[10px] font-mono border border-aura-cyan/30">
              OD₆₈₀ Phase
            </span>
          </div>

          {/* Metric display */}
          <div className="mt-4 mb-2">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold text-aura-text-primary tabular-nums tracking-tight">
                {biomass.dryBiomassDensityGPerL ?? 0.84}
              </span>
              <span className="text-sm font-medium text-aura-cyan">
                g / L (Dry Weight)
              </span>
            </div>

            {/* Growth phase progress bar */}
            <div className="w-full bg-aura-surface-subtle h-2 rounded-full mt-3 overflow-hidden border border-aura-border">
              <div
                className="bg-gradient-to-r from-sky-500 to-aura-cyan h-full rounded-full shadow-[0_0_10px_rgba(56,189,248,0.4)] transition-all duration-500"
                style={{ width: "62%" }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-aura-text-secondary mt-1.5">
              <span>Harvest Threshold: 2.0 g/L</span>
              <span className="text-aura-cyan font-semibold">Exponential Phase</span>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="pt-3 border-t border-aura-border flex items-center justify-between text-[11px] text-aura-text-secondary">
          <span>Optical Density (OD₆₈₀): {biomass.opticalDensity680 ?? 1.28}</span>
          <span className="text-aura-cyan font-mono font-medium">Culture Healthy</span>
        </div>
      </div>
    </div>
  );
};
