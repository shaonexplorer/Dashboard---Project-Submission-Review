"use client";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { StatusFilterTabs } from "./status-filter-tabs";
import { useMemo } from "react";
import { SubmissionStatus } from "@/lib/api/submissions";
import { useMySubmissionStats } from "@/hooks/use-submissions";

export interface SearchFilterBarProps {
  /** Current search term */
  search: string;
  /** Callback when search term changes */
  onSearchChange: (value: string) => void;
  /** Current status filter */
  status: SubmissionStatus | undefined;
  /** Callback when status filter changes */
  onStatusChange: (status: SubmissionStatus | undefined) => void;
  /** Callback when Submit Deliverable button is clicked */
  onSubmitClick: () => void;
  /** Whether a search is in progress */
  isSearching?: boolean;
}

/**
 * Search and filter bar for the student projects table.
 *
 * Combines a search input with Cmd+K hint, status filter tabs,
 * and a primary action button.
 */
export function SearchFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onSubmitClick,
  isSearching,
}: SearchFilterBarProps) {
  const { data: stats } = useMySubmissionStats();

  // Map status filter for display
  const statusCounts = useMemo(
    () => ({
      all: stats?.total ?? 0,
      active: stats?.active ?? 0,
      approved: stats?.approved ?? 0,
      pending: stats?.pending ?? 0,
      rejected: stats?.rejected ?? 0,
      archived: stats?.archived ?? 0,
    }),
    [stats],
  );

  function handleStatusChange(
    statusValue:
      | SubmissionStatus
      | "all"
      | "active"
      | "archived",
  ) {
    if (statusValue === "all") {
      onStatusChange(undefined);
    } else if (statusValue === "active") {
      onStatusChange("PENDING");
    } else if (statusValue === "archived") {
      onStatusChange(undefined);
    } else {
      onStatusChange(statusValue);
    }
  }

  return (
    <div className="flex flex-col gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/40">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <span
            className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px] pointer-events-none"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects, milestones, technologies, or commits..."
            className={cn(
              "w-full max-w-md h-10 pl-10 pr-16 bg-surface-container-low/60 text-on-surface font-body-md text-body-md rounded-lg border border-transparent focus:border-primary/30 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
              isSearching && "bg-surface-container-lowest",
            )}
            aria-label="Search projects"
          />
          <div className="absolute right-2.5 top-2 flex items-center gap-1">
            <Kbd className="px-1.5 py-0.5 rounded bg-surface-container-high/60 text-secondary font-code-sm text-code-sm">
              ⌘K
            </Kbd>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className={cn(
                "h-10 pl-4 pr-8 rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low text-on-surface font-label-md text-label-md appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors border border-transparent",
              )}
            >
              {sortOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined text-secondary text-[18px] absolute right-3 top-2.5 pointer-events-none"
              aria-hidden="true"
            >
              expand_more
            </span>
          </div> */}
          <Button
            onClick={onSubmitClick}
            className={cn(
              "h-10 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-medium hover:bg-primary-container transition-all shadow-sm flex items-center gap-1 shrink-0",
            )}
          >
            <span
              className="material-symbols-outlined text-[18px] text-white"
              aria-hidden="true"
            >
              add
            </span>
            <span className="text-white">Submit Deliverable</span>
          </Button>
        </div>
      </div>

      <StatusFilterTabs
        activeStatus={
          status === undefined
            ? "all"
            : status === "PENDING"
              ? "active"
              : status
        }
        onStatusChange={handleStatusChange}
        counts={statusCounts}
      />
    </div>
  );
}
