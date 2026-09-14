import React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "online"
  | "offline"
  | "normal"
  | "warning"
  | "error"
  | "active"
  | "inactive"
  | "unavailable";

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  showDot = true,
  className,
}) => {
  const getBadgeConfig = () => {
    switch (variant) {
      case "online":
      case "active":
      case "normal":
        return {
          text: label || (variant === "online" ? "Online" : variant === "active" ? "Active" : "Normal"),
          bg: "bg-aura-surface-active text-aura-primary border border-aura-primary/30",
          dot: "bg-aura-primary shadow-glow",
          pulse: true,
        };
      case "warning":
        return {
          text: label || "Warning",
          bg: "bg-aura-amber/10 text-aura-amber border border-aura-amber/30",
          dot: "bg-aura-amber shadow-[0_0_8px_#F59E0B]",
          pulse: false,
        };
      case "error":
        return {
          text: label || "Error",
          bg: "bg-red-500/10 text-red-500 border border-red-500/30",
          dot: "bg-red-500 shadow-[0_0_8px_#EF4444]",
          pulse: true,
        };
      case "offline":
      case "inactive":
        return {
          text: label || (variant === "offline" ? "Offline" : "Inactive"),
          bg: "bg-aura-surface-subtle text-aura-text-secondary border border-aura-border",
          dot: "bg-aura-text-secondary/60",
          pulse: false,
        };
      case "unavailable":
      default:
        return {
          text: label || "Unavailable",
          bg: "bg-aura-surface-subtle text-aura-text-secondary border border-aura-border",
          dot: "bg-aura-text-secondary/40",
          pulse: false,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors font-mono",
        config.bg,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            config.dot,
            config.pulse && "animate-pulse"
          )}
        />
      )}
      <span>{config.text}</span>
    </span>
  );
};
