"use client";

import { Button } from "@/components/ui/button";

export interface SubmissionTableEmptyProps {
  /**
   * True when the table is empty because the active search and filter match
   * nothing, rather than because no submission exists at all.
   */
  isFiltered: boolean;
  /** Clears the search term and the status filter. */
  onReset: () => void;
}

/**
 * The empty state of the submission table.
 *
 * An empty table and a table whose filters match nothing are different
 * situations, and the message says which one it is.
 */
export function SubmissionTableEmpty({
  isFiltered,
  onReset,
}: SubmissionTableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span
        className="material-symbols-outlined text-[32px] text-outline"
        aria-hidden="true"
      >
        {isFiltered ? "search_off" : "inbox"}
      </span>

      <h3 className="text-headline-sm text-on-surface font-semibold">
        {isFiltered
          ? "No submissions match your current search or filters."
          : "No submissions yet."}
      </h3>

      <p className="max-w-md text-body-sm text-on-surface-variant">
        {isFiltered
          ? "Try a different search term, or clear the status filter to see the whole queue."
          : "Student submissions will appear here as soon as they are handed in."}
      </p>

      {isFiltered ? (
        <Button variant="outline" size="sm" onClick={onReset} className="mt-1">
          Clear search and filters
        </Button>
      ) : null}
    </div>
  );
}
