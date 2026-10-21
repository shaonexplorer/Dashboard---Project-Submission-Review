import type { Submission } from "@/lib/api/submissions";
import { formatUtcDateTime } from "@/lib/format";

/**
 * The mentor's assessment of the submission.
 *
 * The card is always rendered so the section keeps its place in the layout.
 * When no review has been recorded yet it shows an explicit empty state
 * instead of disappearing, which keeps "not reviewed yet" visibly different
 * from "reviewed and the notes are missing".
 *
 * Only data the API returns is shown: the review timestamp comes from
 * `reviewedAt`, and the notes come from `feedback`. No reviewer identity or
 * score is displayed, because the student-facing contract does not expose one.
 *
 * A resubmission keeps the previous review on the row, so the notes describe
 * an attempt that is no longer the current one. When that is the case the
 * notes are labelled as belonging to the previous attempt rather than being
 * presented as if they were the current verdict.
 */
export function MentorFeedbackCard({ submission }: { submission: Submission }) {
  const isRejected = submission.status === "REJECTED";
  const notes = submission.feedback?.trim() ?? "";
  const hasNotes = notes.length > 0;
  const hasReviewDate = Boolean(submission.reviewedAt);
  /**
   * The retained notes belong to an earlier attempt only while the review
   * recorded on the row predates the latest hand-in.
   *
   * A resubmission keeps the previous review on the row, so between the
   * resubmission and the next review the notes are the old ones. Once a
   * mentor reviews the new attempt, `reviewedAt` moves past `resubmittedAt`
   * and the notes belong to the attempt that is on screen — the attempt
   * counter alone cannot tell the two apart, because it stays at the same
   * value across both.
   */
  const isFromPreviousAttempt =
    submission.attempt > 1 &&
    submission.resubmittedAt !== null &&
    submission.reviewedAt !== null &&
    new Date(submission.reviewedAt).getTime() <
      new Date(submission.resubmittedAt).getTime();
  /** The attempt the retained notes were written for. */
  const notesAttempt = isFromPreviousAttempt ? submission.attempt - 1 : submission.attempt;

  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 md:p-8 shadow-sm flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`size-8 rounded-lg flex items-center justify-center ${
              isRejected
                ? "bg-error-container text-error"
                : "bg-surface-container text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              aria-hidden="true"
            >
              rate_review
            </span>
          </div>
          <div>
            <h3 className="text-headline-sm text-on-surface">Mentor Feedback</h3>
            <p className="text-label-sm text-secondary">
              {isFromPreviousAttempt
                ? `Assessment of attempt ${notesAttempt}`
                : hasReviewDate
                  ? "Verified assessment record"
                  : "Awaiting a mentor assessment"}
            </p>
          </div>
        </div>

        <span className="text-code-sm text-secondary">
          {hasReviewDate
            ? `${
                isFromPreviousAttempt
                  ? `Attempt ${notesAttempt} reviewed`
                  : "Reviewed"
              } ${formatUtcDateTime(submission.reviewedAt)}`
            : "Not reviewed yet"}
        </span>
      </div>

      {hasNotes ? (
        <div className="relative bg-surface-container-low/70 p-6 rounded-r-lg rounded-l-none pl-10">
          <div
            className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l ${
              isRejected ? "bg-error" : "bg-primary"
            }`}
            aria-hidden="true"
          />
          {isFromPreviousAttempt ? (
            <span className="font-code-sm text-code-sm uppercase tracking-wider text-secondary">
              Previous attempt · attempt {notesAttempt}
            </span>
          ) : null}
          <p className="text-body-md text-on-surface italic leading-relaxed whitespace-pre-line">
            {notes}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-6 py-5 rounded-lg bg-surface-container-low/70">
          <span
            className="material-symbols-outlined text-secondary text-[20px] shrink-0"
            aria-hidden="true"
          >
            hourglass_empty
          </span>
          <p className="text-body-md text-on-surface-variant">
            No feedback yet.{" "}
            {submission.status === "PENDING"
              ? "Your project is still in the review queue, and the mentor notes will appear here once the review is complete."
              : "The review is complete, but no notes were recorded."}
          </p>
        </div>
      )}
    </div>
  );
}
