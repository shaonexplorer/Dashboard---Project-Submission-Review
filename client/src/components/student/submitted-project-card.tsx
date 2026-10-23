import type { Submission } from "@/lib/api/submissions";
import { MentorFeedbackCard } from "./mentor-feedback-card";
import { ResubmitForm } from "./resubmit-form";
import { SubmissionDetailsCard } from "./submission-details-card";
import { SubmissionStatusPanel } from "./submission-status-panel";

/**
 * Read-only view of one of the student's submitted projects.
 *
 * Composes the status banner, the project details and the mentor feedback.
 * A rejected submission also carries the resubmission action — the only
 * state in which a submission can be changed.
 */
export function SubmittedProjectCard({
  submission,
}: {
  submission: Submission;
}) {
  const isRejected = submission.status === "REJECTED";

  return (
    <div className="flex flex-col gap-6">
      <SubmissionStatusPanel
        status={submission.status}
        hasFeedback={Boolean(submission.feedback?.trim())}
        attempt={submission.attempt}
      />

      <SubmissionDetailsCard submission={submission} />

      <MentorFeedbackCard submission={submission} />

      {isRejected ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 p-5">
          <div className="flex flex-col gap-1">
            <span className="font-code-sm text-code-sm uppercase tracking-wider text-secondary">
              Action required
            </span>
            <p className="text-body-sm text-on-surface-variant">
              Address the mentor&apos;s notes and send attempt{" "}
              {submission.attempt + 1} for this project.
            </p>
          </div>
          <ResubmitForm submission={submission} />
        </div>
      ) : null}
    </div>
  );
}
