import type { Submission } from "@/lib/api/submissions";
import { formatUtcDateTime } from "@/lib/format";
import { getSubmissionStatusMeta } from "./submission-status-badge";

/**
 * A compact list of the student's submissions.
 *
 * A student may now hold one submission per catalog project, so the panel
 * lists them all rather than describing a single one. Every row carries the
 * project code, the attempt number and the review state, which is what the
 * student needs to tell two projects apart at a glance.
 */
export function SubmissionSnapshotCard({
  submissions,
}: {
  submissions: Submission[];
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-label-md text-on-surface font-bold">
          Submission Snapshot
        </h3>
        <span className="text-code-sm text-secondary">
          {submissions.length} {submissions.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {submissions.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">
          Nothing submitted yet. Pick a project from the catalog to start.
        </p>
      ) : (
        <dl className="flex flex-col gap-3 text-label-md">
          {submissions.map((submission) => {
            const meta = getSubmissionStatusMeta(submission.status);

            return (
              <div
                key={submission.id}
                className="flex flex-col gap-1 border-b border-surface-container-high/60 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex min-w-0 items-center gap-2">
                    <span className="font-code-sm text-code-sm font-semibold uppercase text-secondary">
                      {submission.projectId}
                    </span>
                    <span className="truncate text-on-surface">
                      {submission.projectName}
                    </span>
                  </dt>
                  <dd className="shrink-0 text-code-sm text-on-surface text-right">
                    {meta.label}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">Submitted</dt>
                  <dd className="text-code-sm text-on-surface-variant text-right">
                    {formatUtcDateTime(submission.submittedAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">Attempt</dt>
                  <dd className="text-code-sm text-on-surface-variant text-right">
                    Attempt {submission.attempt}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
