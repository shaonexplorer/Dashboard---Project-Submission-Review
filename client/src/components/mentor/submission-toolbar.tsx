"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import type { SubmissionStatus } from "@/lib/api/submissions";
import type {
  SubmissionSortField,
  SubmissionSortOrder,
  SubmissionStats,
} from "@/lib/api/mentor-submissions";
import { StatusFilterTabs } from "./status-filter-tabs";
import { SubmissionSortControl } from "./submission-sort-control";

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
  /** The column the server is ordering the results by. */
  sortBy: SubmissionSortField;
  /** The direction the server is ordering the results in. */
  sortOrder: SubmissionSortOrder;
  /** Called with the new column and direction. */
  onSortChange: (
    sortBy: SubmissionSortField,
    sortOrder: SubmissionSortOrder,
  ) => void;
}

/**
 * The controls above the submission table: free-text search, the status
 * filter and the sort.
 *
 * Every control describes *what the server should return* — none of them filter
 * the rows that are already on screen.
 */
export function SubmissionToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  stats,
  sortBy,
  sortOrder,
  onSortChange,
}: SubmissionToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // The shortcut is shown as `⌘K` on Apple devices and `Ctrl K` everywhere
  // else. It is read after mount, because the server has no idea which
  // platform is asking.
  const [shortcut, setShortcut] = useState("⌘K");

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/i.test(
      navigator.userAgent ?? navigator.platform,
    );

    setShortcut(isApple ? "⌘K" : "Ctrl K");
  }, []);

  // `⌘K` / `Ctrl K` moves the caret into the search box from anywhere on the
  // page, so a mentor can start a search without reaching for the mouse.
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }

    document.addEventListener("keydown", handleShortcut);

    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 lg:max-w-xl">
          <label htmlFor="submission-search" className="sr-only">
            Search submissions by project name, student name or email
          </label>
          <Input
            id="submission-search"
            ref={searchInputRef}
            // type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search student name, project title, or email..."
            className="border border-surface-container-high pr-24"
            leadingIcon={
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                search
              </span>
            }
            trailingIcon={
              <div className="flex items-center gap-1">
                <Kbd className="pointer-events-none select-none">
                  {shortcut}
                </Kbd>
                {search.length > 0 ? (
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
                ) : null}
              </div>
            }
          />
        </div>

        <SubmissionSortControl
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      </div>

      <StatusFilterTabs
        status={status}
        onStatusChange={onStatusChange}
        stats={stats}
      />
    </div>
  );
}
