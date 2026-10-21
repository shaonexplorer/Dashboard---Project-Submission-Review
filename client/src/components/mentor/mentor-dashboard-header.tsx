"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface MentorDashboardHeaderProps {
  /** The name of the signed-in mentor. */
  mentorName?: string;
  /** True while a refresh is in flight. */
  isRefreshing: boolean;
  /** Re-reads the queue from the server. */
  onRefresh: () => void;
}

/**
 * The heading of the mentor dashboard.
 *
 * The refresh control re-reads the queue rather than reloading the page, so
 * the mentor keeps the filters, the search term and the page they were
 * looking at.
 */
export function MentorDashboardHeader({
  mentorName,
  isRefreshing,
  onRefresh,
}: MentorDashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 pb-8 border-b border-surface-container-high/60 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-col gap-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 font-code-sm text-code-sm uppercase tracking-wider text-on-surface-variant"
        >
          <span className="text-primary font-semibold">Mentor Portal</span>
          <span className="text-outline" aria-hidden="true">
            /
          </span>
          <span className="text-label-sm uppercase tracking-wider">
            Triage &amp; Review
          </span>
        </nav>

        <h1 className="text-headline-lg text-on-surface tracking-tight">
          Review Dashboard
        </h1>

        <p className="text-body-md text-on-surface-variant max-w-2xl">
          {mentorName
            ? `Welcome back, ${mentorName}. Audit student submissions, evaluate the delivered project against the rubric, and record a decision for every hand-in.`
            : "Audit student submissions, evaluate the delivered project against the rubric, and record a decision for every hand-in."}
        </p>
      </div>

      <div className="flex items-center gap-3 self-start lg:self-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh the submission queue"
        >
          {isRefreshing ? (
            <Spinner />
          ) : (
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              sync
            </span>
          )}
          Refresh
        </Button>
      </div>
    </header>
  );
}
