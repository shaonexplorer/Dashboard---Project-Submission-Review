"use client";

import Link from "next/link";
import type { Submission, SubmissionStatus } from "@/lib/api/submissions";
import { formatUtcDateTime } from "@/lib/format";

interface SubmissionDetailHeaderProps {
  /** The submission data */
  submission: Submission;
  /** Current status for display */
  status: SubmissionStatus;
  /** Whether we're in a loading state */
  isLoading?: boolean;
}

/**
 * Header component for the submission detail page.
 *
 * Displays the project name, status badge, breadcrumbs, and key metadata
 * like submission date, attempt number, and review date.
 */
export function SubmissionDetailHeader({
  submission,
  status,
  isLoading,
}: SubmissionDetailHeaderProps) {
  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED";
  const isRejected = status === "REJECTED";

  const getStatusBadge = () => {
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 font-label-md text-label-md font-medium">
          <span
            className="w-2 h-2 rounded-full bg-amber-500 animate-ping"
            aria-hidden="true"
          />
          <span>Under Review</span>
        </span>
      );
    }
    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-label-md text-label-md font-medium">
          <span
            className="material-symbols-outlined text-[16px] text-emerald-600"
            aria-hidden="true"
          >
            check_circle
          </span>
          <span>Approved</span>
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container text-on-error-container font-label-md text-label-md font-medium">
          <span
            className="material-symbols-outlined text-[16px]"
            aria-hidden="true"
          >
            error
          </span>
          <span>Changes Required</span>
        </span>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-6 w-48 bg-surface-container-highest rounded" />
          <div className="h-8 w-64 bg-surface-container-highest rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-surface-container-highest rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 space-y-4">
      {/* Breadcrumbs & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
          <Link
            href="/student/my-projects"
            className="text-secondary hover:text-on-surface transition-colors"
          >
            My Projects
          </Link>
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            chevron_right
          </span>
          <span className="text-on-surface font-medium">{submission.projectName}</span>
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            chevron_right
          </span>
          <span className="text-primary font-medium">{submission.projectId}</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-surface-container-high/60">
        <div className="flex flex-col gap-1">
          <span className="text-label-sm text-secondary uppercase tracking-wider">
            Submitted
          </span>
          <span className="text-body-md text-on-surface font-medium">
            {formatUtcDateTime(submission.submittedAt)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-label-sm text-secondary uppercase tracking-wider">
            Attempt
          </span>
          <span className="text-body-md text-on-surface font-medium">
            Attempt {submission.attempt}
            {submission.attempt > 1 && submission.resubmittedAt && (
              <span className="text-secondary font-normal ml-1">
                ({formatUtcDateTime(submission.resubmittedAt).split(",")[0]})
              </span>
            )}
          </span>
        </div>
        {submission.reviewedAt && (
          <div className="flex flex-col gap-1">
            <span className="text-label-sm text-secondary uppercase tracking-wider">
              Reviewed
            </span>
            <span className="text-body-md text-on-surface font-medium">
              {formatUtcDateTime(submission.reviewedAt)}
            </span>
          </div>
        )}
        {isApproved && submission.feedback && (
          <div className="flex flex-col gap-1">
            <span className="text-label-sm text-secondary uppercase tracking-wider">
              Score
            </span>
            <span className="text-body-md text-on-surface font-medium text-emerald-600">
              94/100
            </span>
          </div>
        )}
      </div>
    </div>
  );
}