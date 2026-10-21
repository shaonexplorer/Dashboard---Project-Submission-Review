"use client";

import type {
  SubmissionSortField,
  SubmissionSortOrder,
} from "@/lib/api/mentor-submissions";

/**
 * The columns the server is able to sort by, in the order they appear in the
 * table.
 *
 * The list is an explicit whitelist — the client never sends a field name the
 * server has not agreed to sort on.
 */
const SORT_OPTIONS: { value: SubmissionSortField; label: string }[] = [
  { value: "projectName", label: "Project" },
  { value: "status", label: "Status" },
  { value: "createdAt", label: "Submitted At" },
];

export interface SubmissionSortControlProps {
  /** The column the results are ordered by. */
  sortBy: SubmissionSortField;
  /** The direction the results are ordered in. */
  sortOrder: SubmissionSortOrder;
  /** Called with the new column and direction. */
  onSortChange: (
    sortBy: SubmissionSortField,
    sortOrder: SubmissionSortOrder,
  ) => void;
}

/**
 * The sort control above the submission table.
 *
 * It describes the order the server is asked for — the same order the sortable
 * table headers produce — so a mentor can sort without hunting for the header
 * of the column they want.
 */
export function SubmissionSortControl({
  sortBy,
  sortOrder,
  onSortChange,
}: SubmissionSortControlProps) {
  const isAscending = sortOrder === "asc";

  return (
    <div className="hidden items-center gap-2 text-body-sm text-on-surface-variant sm:flex">
      <span className="font-code-sm text-code-sm">Sort by:</span>

      <div className="relative">
        <label htmlFor="submission-sort" className="sr-only">
          Sort submissions by column
        </label>
        <select
          id="submission-sort"
          value={sortBy}
          onChange={(event) =>
            onSortChange(event.target.value as SubmissionSortField, sortOrder)
          }
          className="h-10 cursor-pointer appearance-none rounded-lg bg-surface-container-low pl-3 pr-8 text-label-md text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary-container/20"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-[18px] text-on-surface-variant"
          aria-hidden="true"
        >
          expand_more
        </span>
      </div>

      <button
        type="button"
        onClick={() => onSortChange(sortBy, isAscending ? "desc" : "asc")}
        aria-label={isAscending ? "Sort descending" : "Sort ascending"}
        className="flex size-8 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className="material-symbols-outlined text-[16px]"
          aria-hidden="true"
        >
          {isAscending ? "arrow_upward" : "arrow_downward"}
        </span>
      </button>
    </div>
  );
}
