"use client";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { StatusFilterTabs } from "./status-filter-tabs";
import { useMemo, useState } from "react";
import { StudentSubmissionListQuery } from "@/lib/api/submissions";
import { useMySubmissionStats } from "@/hooks/use-submissions";

export interface SearchFilterBarProps {
  /** Current search term */
  search: string;
  /** Callback when search term changes */
  onSearchChange: (value: string) => void;
  /** Current cohort filter */
  cohort: string;
  /** Callback when cohort changes */
  onCohortChange: (value: string) => void;
  /** Current tech stack filter */
  techStack: string;
  /** Callback when tech stack changes */
  onTechStackChange: (value: string) => void;
  /** Current sort option */
  sortBy: string;
  /** Callback when sort changes */
  onSortChange: (value: string) => void;
  /** Callback when Submit Deliverable button is clicked */
  onSubmitClick: () => void;
  /** Whether a search is in progress */
  isSearching?: boolean;
}

/**
 * Search and filter bar for the student projects table.
 *
 * Combines a search input with Cmd+K hint, three dropdown filters
 * (Cohort, Tech Stack, Sort), and a primary action button.
 */
export function SearchFilterBar({
  search,
  onSearchChange,
  cohort,
  onCohortChange,
  techStack,
  onTechStackChange,
  sortBy,
  onSortChange,
  onSubmitClick,
  isSearching,
}: SearchFilterBarProps) {
  const cohortOptions = [
    "Cohort 24-B",
    "Cohort 24-A (Archived)",
    "All Cohorts",
  ];

  const techStackOptions = [
    "All Tech Stacks",
    "TypeScript / React",
    "Go / Distributed",
    "Kafka / Rust",
    "C / Linux",
  ];

  const sortOptions = [
    "Sort by: Due Date / Urgency",
    "Sort by: Status",
    "Sort by: Milestone ID",
    "Sort by: Grade (High to Low)",
  ];

  const [statusFilter, setStatusFilter] =
    useState<StudentSubmissionListQuery["status"]>(undefined);

  const [page, setPage] = useState(1);
  const { data: stats } = useMySubmissionStats();

  // Map status filter for display (moved before early returns)
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
    status:
      | StudentSubmissionListQuery["status"]
      | "all"
      | "active"
      | "archived",
  ) {
    if (status === "all") {
      setStatusFilter(undefined);
    } else if (status === "active") {
      setStatusFilter("PENDING");
    } else if (status === "archived") {
      setStatusFilter(undefined);
    } else {
      setStatusFilter(status);
    }
    setPage(1);
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
          statusFilter === undefined
            ? "all"
            : statusFilter === "PENDING"
              ? "active"
              : statusFilter
        }
        onStatusChange={handleStatusChange}
        counts={statusCounts}
      />
    </div>
  );
}
