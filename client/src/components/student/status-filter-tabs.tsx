"use client";

import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/api/submissions";

export interface StatusFilterTabsProps {
  /** Currently active status filter */
  activeStatus: SubmissionStatus | "all" | "active" | "archived" | undefined;
  /** Callback when status filter changes */
  onStatusChange: (
    status: SubmissionStatus | "all" | "active" | "archived" | undefined,
  ) => void;
  /** Counts for each status */
  counts: {
    all: number;
    active: number;
    approved: number;
    pending: number;
    rejected: number;
    archived: number;
  };
}

interface StatusTabConfig {
  value: SubmissionStatus | "all" | "active" | "archived" | undefined;
  label: string;
  countKey: keyof StatusFilterTabsProps["counts"];
  icon?: string;
}

/**
 * Status filter tabs for the student projects table.
 *
 * Renders horizontal scrolling tabs with counts. The active tab is
 * visually distinguished with a filled background and primary text.
 */
export function StatusFilterTabs({
  activeStatus,
  onStatusChange,
  counts,
}: StatusFilterTabsProps) {
  const tabs: StatusTabConfig[] = [
    { value: "all", label: "All Projects", countKey: "all" },
    {
      value: "active",
      label: "Active / In Progress",
      countKey: "active",
      icon: "schedule",
    },
    {
      value: "APPROVED",
      label: "Approved",
      countKey: "approved",
      icon: "check_circle",
    },
    // {
    //   value: "PENDING",
    //   label: "Under Review",
    //   countKey: "pending",
    //   icon: "hourglass_top",
    // },
    {
      value: "REJECTED",
      label: "Changes Required",
      countKey: "rejected",
      icon: "edit",
    },
    // { value: "archived", label: "Archived", countKey: "archived", icon: "archive" },
  ];

  const isActive = (value: StatusTabConfig["value"]) => activeStatus === value;

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-outline-variant/30 scrollbar-none"
      role="tablist"
      aria-label="Filter submissions by status"
    >
      {tabs.map((tab) => {
        const count = counts[tab.countKey];
        const active = isActive(tab.value);

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${tab.value}`}
            id={`tab-${tab.value}`}
            onClick={() => onStatusChange(tab.value)}
            className={cn(
              "px-4 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap flex items-center gap-1.5 transition-colors",
              active
                ? "bg-surface-container-high text-on-surface font-medium shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low",
            )}
          >
            <span className="text-sm    ">{tab.label}</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full font-code-sm text-code-sm",
                active
                  ? "bg-surface-container-lowest text-primary"
                  : "bg-surface-container-low text-secondary",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
