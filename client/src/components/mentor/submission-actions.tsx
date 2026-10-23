"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type {
  MentorSubmission,
  ReviewDecision,
} from "@/lib/api/mentor-submissions";

export interface SubmissionActionsProps {
  /** The row the actions belong to. */
  submission: MentorSubmission;
  /** True while a request for this row is in flight. */
  isBusy: boolean;
  /**
   * True while any review request is in flight.
   *
   * Only one review may be recorded at a time, so the other rows are held
   * back until the current one settles.
   */
  isLocked: boolean;
  /** Opens the review drawer for this submission. */
  onReview: (submission: MentorSubmission) => void;
  /** Records a decision for this submission. */
  onDecision: (submission: MentorSubmission, decision: ReviewDecision) => void;
}

/**
 * The review actions of a table row.
 *
 * Every action targets the submission by its stable id, never by its position
 * in the table, so a row that moved between requests cannot be reviewed by
 * mistake.
 */
export function SubmissionActions({
  submission,
  isBusy,
  isLocked,
  onReview,
  onDecision,
}: SubmissionActionsProps) {
  const isPending = submission.status === "PENDING";
  const isDisabled = isBusy || isLocked;

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* {isPending ? (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={isDisabled}
            onClick={() => onDecision(submission, "APPROVED")}
            aria-label={`Approve ${submission.projectName}`}
          >
            {isBusy ? (
              <Spinner />
            ) : (
              <span
                className="material-symbols-outlined text-[16px]"
                aria-hidden="true"
              >
                check
              </span>
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isDisabled}
            onClick={() => onDecision(submission, "REJECTED")}
            aria-label={`Reject ${submission.projectName}`}
          >
            {isBusy ? (
              <Spinner />
            ) : (
              <span
                className="material-symbols-outlined text-[16px]"
                aria-hidden="true"
              >
                cancel
              </span>
            )}
            Reject
          </Button>
        </>
      ) : null} */}

      <Button
        size="sm"
        onClick={() => onReview(submission)}
        aria-label={`Open the review of ${submission.projectName}`}
      >
        <span
          className="material-symbols-outlined text-[16px]"
          aria-hidden="true"
        >
          rate_review
        </span>
        Review
      </Button>
    </div>
  );
}
