import type { Submission } from "@/lib/api/submissions";
import { formatUtcDateTime } from "@/lib/format";
import { ExternalLinkCard } from "./external-link-card";
import { SubmissionStatusBadge } from "./submission-status-badge";

/**
 * Read-only view of the submitted project.
 *
 * Everything shown here comes from the API response — the project name, the
 * catalog code, the description, both links, the status and the moment the
 * project was handed in.
 */
export function SubmissionDetailsCard({ submission }: { submission: Submission }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 md:p-8 shadow-sm flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-code-sm text-secondary">
          <span className="px-2 py-0.5 rounded bg-surface-container font-medium text-on-surface">
            #{submission.id.slice(0, 8).toUpperCase()}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatUtcDateTime(submission.submittedAt)}</span>
        </div>
        <SubmissionStatusBadge status={submission.status} />
      </div>

      <div className="flex flex-col gap-2">
        {/*
          The catalog code is the project's identity in every other view — it
          is what the mentor table shows and what the student and the mentor
          quote to each other — so it is shown here too, next to the name.
        */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-surface-container font-code-sm text-code-sm uppercase font-semibold text-secondary">
            {submission.projectId}
          </span>
          <h3 className="text-headline-lg text-on-surface tracking-tight">
            {submission.projectName}
          </h3>
        </div>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {submission.description}
        </p>
      </div>

      {/* External links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <ExternalLinkCard
          href={submission.repoUrl}
          title="View Repository"
          icon="terminal"
        />
        <ExternalLinkCard
          href={submission.liveUrl}
          title="View Live Project"
          icon="public"
        />
      </div>
    </div>
  );
}
