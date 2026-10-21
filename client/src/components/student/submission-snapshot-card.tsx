import type { Submission } from "@/lib/api/submissions";
import { formatUtcDateTime } from "@/lib/format";
import { getSubmissionStatusMeta } from "./submission-status-badge";

/**
 * Snapshot of the identifiers and timestamps belonging to the submission.
 *
 * The review date only appears once a review has actually been recorded, so
 * the panel never claims a decision that has not been made.
 */
export function SubmissionSnapshotCard({
  submission,
}: {
  submission: Submission;
}) {
  const meta = getSubmissionStatusMeta(submission.status);

  const rows: Array<{ label: string; value: string }> = [
    { label: "Submission ID", value: submission.id.slice(0, 8).toUpperCase() },
    { label: "Submitted", value: formatUtcDateTime(submission.submittedAt) },
    { label: "Status", value: meta.label },
  ];

  if (submission.reviewedAt) {
    rows.push({
      label: "Reviewed",
      value: formatUtcDateTime(submission.reviewedAt),
    });
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-4">
      <h3 className="text-label-md text-on-surface font-bold">
        Submission Snapshot
      </h3>
      <dl className="flex flex-col gap-3 text-label-md">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4"
          >
            <dt className="text-on-surface-variant">{row.label}</dt>
            <dd className="text-code-sm text-on-surface text-right">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
