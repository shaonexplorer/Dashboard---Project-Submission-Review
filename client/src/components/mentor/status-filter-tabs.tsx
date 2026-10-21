"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/api/submissions";
import type { SubmissionStats } from "@/lib/api/mentor-submissions";

/**
 * The status filter options, in the order they are shown.
 *
 * The order follows the mockup: everything first, then the queue that still
 * needs a decision, then the two outcomes a decision can have.
 */
const STATUS_FILTERS = [
  { value: "ALL", label: "All Submissions", countKey: "total" },
  { value: "PENDING", label: "Pending Review", countKey: "pending" },
  { value: "REJECTED", label: "Changes Required", countKey: "rejected" },
  { value: "APPROVED", label: "Approved", countKey: "approved" },
] as const;

export interface StatusFilterTabsProps {
  /** The active status filter. `undefined` means "no restriction". */
  status: SubmissionStatus | undefined;
  /** Called whenever the status filter changes. */
  onStatusChange: (status: SubmissionStatus | undefined) => void;
  /** Counts shown next to each filter option. */
  stats: SubmissionStats;
}

/**
 * The segmented status filter above the submission table.
 *
 * Each option carries the number of submissions in that status, so a mentor
 * can see how much is waiting before they narrow the queue down.
 *
 * The filter describes *what the server should return* — it never filters the
 * rows that are already on screen.
 */
export function StatusFilterTabs({
  status,
  onStatusChange,
  stats,
}: StatusFilterTabsProps) {
  const activeValue = status ?? "ALL";

  return (
    <div className="flex items-center justify-between gap-4 overflow-x-auto">
      <ToggleGroup
        value={[activeValue]}
        onValueChange={(values) => {
          // A single-selection group reports an empty array when the active
          // option is pressed again. The filter always has one active
          // option, so an empty selection is ignored.
          const next = values[values.length - 1];

          if (next) {
            onStatusChange(next === "ALL" ? undefined : (next as SubmissionStatus));
          }
        }}
        aria-label="Filter submissions by status"
      >
        {STATUS_FILTERS.map((filter) => (
          <ToggleGroupItem key={filter.value} value={filter.value}>
            <span className="flex items-center gap-2">
              {filter.value === "PENDING" ? (
                <span
                  className="size-2 rounded-full bg-primary"
                  aria-hidden="true"
                />
              ) : null}
              <span>{filter.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-code-sm",
                  filter.value === activeValue
                    ? "bg-primary-fixed text-on-primary-fixed-variant font-semibold"
                    : "bg-surface-container text-on-surface-variant",
                )}
              >
                {stats[filter.countKey]}
              </span>
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
