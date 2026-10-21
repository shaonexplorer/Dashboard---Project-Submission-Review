"use client";

import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/api/submissions";
import type { SubmissionStats } from "@/lib/api/mentor-submissions";

/** The status filter options, in the order they are shown. */
const STATUS_FILTERS = [
  { value: "ALL", label: "All Submissions", countKey: "total" },
  { value: "PENDING", label: "Pending Review", countKey: "pending" },
  { value: "APPROVED", label: "Approved", countKey: "approved" },
  { value: "REJECTED", label: "Changes Required", countKey: "rejected" },
] as const;

export interface SubmissionToolbarProps {
  /** The raw text in the search box. */
  search: string;
  /** Called whenever the search box changes. */
  onSearchChange: (value: string) => void;
  /** The active status filter. `undefined` means "no restriction". */
  status: SubmissionStatus | undefined;
  /** Called whenever the status filter changes. */
  onStatusChange: (status: SubmissionStatus | undefined) => void;
  /** Counts shown next to each filter option. */
  stats: SubmissionStats;
}

/**
 * The controls above the submission table: free-text search and the status
 * filter.
 *
 * Both controls describe *what the server should return* — neither one filters
 * the rows that are already on screen.
 */
export function SubmissionToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  stats,
}: SubmissionToolbarProps) {
  const activeValue = status ?? "ALL";

  const handleStatusChange = (value: string) => {
    onStatusChange(value === "ALL" ? undefined : (value as SubmissionStatus));
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 lg:max-w-xl">
          <label htmlFor="submission-search" className="sr-only">
            Search submissions by project name, student name or email
          </label>
          <Input
            id="submission-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search student name, project title, or email..."
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                search
              </span>
            }
            trailingIcon={
              search.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="flex items-center justify-center rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <span
                    className="material-symbols-outlined text-[16px]"
                    aria-hidden="true"
                  >
                    close
                  </span>
                </button>
              ) : undefined
            }
          />
        </div>

        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <span className="font-code-sm text-code-sm">Sort by:</span>
          <span className="text-label-md text-on-surface font-medium">
            Column headers
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 overflow-x-auto">
        <ToggleGroup
          value={[activeValue]}
          onValueChange={(values) => {
            // A single-selection group reports an empty array when the active
            // option is pressed again. The filter always has one active
            // option, so an empty selection is ignored.
            const next = values[values.length - 1];

            if (next) {
              handleStatusChange(next);
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
    </div>
  );
}
