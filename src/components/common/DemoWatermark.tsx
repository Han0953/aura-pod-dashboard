import React from "react";
import { Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoWatermarkProps {
  className?: string;
}

export const DemoWatermark: React.FC<DemoWatermarkProps> = ({ className }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aura-surface-active/80 border border-aura-primary/20 text-xs text-aura-primary backdrop-blur-md shadow-[0_0_12px_rgba(0,229,153,0.15)]",
        className
      )}
    >
      <Sparkles className="w-3.5 h-3.5 animate-pulse text-aura-primary" />
      <span className="font-medium tracking-wide">
        DEMO MODE <span className="text-aura-text-secondary">· Realistic IoT Simulation</span>
      </span>
      <div className="group relative cursor-help ml-1">
        <Info className="w-3.5 h-3.5 text-aura-text-secondary hover:text-aura-primary transition-colors" />
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col w-56 p-2.5 rounded-lg bg-aura-surface border border-aura-border text-[11px] text-aura-text-secondary shadow-xl z-50">
          <p className="font-semibold text-aura-text-primary mb-1">AURA Pod IoT Mock Layer</p>
          <p>
            Data telemetry dihasilkan secara simulasi berbasis model biologis. Siap disambungkan ke Blynk IoT REST API / WebSocket pada Fase 4.
          </p>
        </div>
      </div>
    </div>
  );
};
