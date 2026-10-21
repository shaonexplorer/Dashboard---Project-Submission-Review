import { cn } from "@/lib/utils";

export interface StatCardProps {
  /** Short uppercase label of the metric, e.g. `Total Submissions`. */
  label: string;
  /** The value reported by the server. */
  value: number;
  /** Material Symbols ligature shown in the icon chip. */
  icon: string;
  /** Background and text colour of the icon chip. */
  iconClassName: string;
  /** Colour of the bar at the bottom of the card. */
  barClassName: string;
  /** Share of the total, expressed as a percentage between 0 and 100. */
  share: number;
  /** Text of the small chip next to the value. */
  chip: string;
  /** Supporting sentence at the bottom left of the card. */
  hint: string;
  /** Supporting value at the bottom right of the card. */
  detail: string;
}

/**
 * A single statistics card.
 *
 * The value always comes from the server — the card never counts the rows the
 * table happens to have loaded. The bar visualises the card's share of the
 * total, which is derived from the same server numbers.
 */
export function StatCard({
  label,
  value,
  icon,
  iconClassName,
  barClassName,
  share,
  chip,
  hint,
  detail,
}: StatCardProps) {
  // The bar is clamped so a rounding artefact can never make it overflow.
  const width = Math.min(100, Math.max(0, share));

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]">
      <div className="flex items-center justify-between">
        <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
          {label}
        </span>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-display text-on-surface font-bold">{value}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2 py-0.5 text-code-sm text-on-surface-variant font-medium">
          {chip}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 text-body-sm text-on-surface-variant">
        <span className="truncate">{hint}</span>
        <span className="shrink-0 text-code-sm text-on-surface font-medium">
          {detail}
        </span>
      </div>

      <div
        className="h-1 w-full overflow-hidden rounded-full bg-surface-container"
        role="presentation"
      >
        <div
          className={cn("h-1 rounded-full", barClassName)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
