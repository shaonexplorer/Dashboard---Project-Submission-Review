"use client";

import { cn } from "@/lib/utils";

export interface MetricCardProps {
  /** The metric label (e.g., "Milestones Tracked") */
  label: string;
  /** The main numeric value (e.g., "3") */
  value: string | number;
  /** Optional subtitle (e.g., "/ 3 active") */
  subtitle?: string;
  /** Material Symbols icon name */
  icon: string;
  /** Color variant for the indicator dot */
  indicatorColor?: "primary" | "emerald" | "amber" | "secondary";
  /** Optional trend label (e.g., "94/100 Avg", "In Queue") */
  trendLabel?: string;
  /** Trend label color variant */
  trendColor?: "emerald" | "amber" | "secondary" | "primary";
}

/**
 * Metric card for the summary strip.
 *
 * Displays a label, large numeric value, optional subtitle, and an
 * indicator dot with optional trend label.
 */
export function MetricCard({
  label,
  value,
  subtitle,
  icon,
  indicatorColor = "primary",
  trendLabel,
  trendColor,
}: MetricCardProps) {
  const indicatorColors = {
    primary: "bg-primary",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500 animate-pulse",
    secondary: "bg-secondary-fixed-dim",
  };

  const trendColors = {
    emerald: "text-emerald-800 bg-emerald-50",
    amber: "text-amber-800 bg-amber-50",
    secondary: "text-on-surface-variant",
    primary: "text-primary bg-primary-container",
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        <span
          className="material-symbols-outlined text-secondary text-[20px]"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-display text-on-surface">
          {value}
        </span>
        {subtitle && (
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {subtitle}
          </span>
        )}
      </div>
      {(trendLabel || indicatorColor) && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/30">
          <span
            className={`w-2.5 h-2.5 rounded-full ${indicatorColors[indicatorColor]}`}
            aria-hidden="true"
          />
          {trendLabel && (
            <span
              className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-medium ${
                trendColor ? trendColors[trendColor] : ""
              }`}
            >
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
