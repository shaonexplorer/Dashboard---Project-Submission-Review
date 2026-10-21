import type { Submission } from "@/lib/api/submissions";
import { MentorFeedbackCard } from "./mentor-feedback-card";
import { SubmissionDetailsCard } from "./submission-details-card";
import { SubmissionStatusPanel } from "./submission-status-panel";

/**
 * Read-only view of the student's submitted project.
 *
 * Composes the status banner, the project details and the mentor feedback.
 * Replaces the submission form once the server confirms the submission, and
 * is also what a student sees after a refresh or a new session.
 */
export function SubmittedProjectCard({
  submission,
}: {
  submission: Submission;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SubmissionStatusPanel
        status={submission.status}
        hasFeedback={Boolean(submission.feedback?.trim())}
      />

      <SubmissionDetailsCard submission={submission} />

      <MentorFeedbackCard submission={submission} />
    </div>
  );
}
