import { formatUrlLabel, formatUtcDateTime } from "@/lib/format";
import type { Submission, SubmissionStatus } from "@/lib/api/submissions";
import { SubmissionStatusBadge, getSubmissionStatusMeta } from "./submission-status-badge";

interface StatusPanel {
  icon: string;
  title: string;
  body: string;
  /**
   * Optional continuation used when the API actually exposes mentor feedback.
   * The current submission endpoint does not return it yet, so the default
   * copy must not promise notes that are never rendered.
   */
  bodyWithFeedback?: string;
  panelClassName: string;
  iconBoxClassName: string;
}

/** Headline messaging for the current status of the submission. */
const STATUS_PANEL: Record<SubmissionStatus, StatusPanel> = {
  PENDING: {
    icon: "schedule",
    title: "Awaiting mentor review",
    body: "Your project has been received and is queued for technical assessment. A mentor will pick it up shortly.",
    panelClassName: "bg-surface-container-low",
    iconBoxClassName: "bg-primary text-on-primary",
  },
  APPROVED: {
    icon: "verified",
    title: "Project approved",
    body: "Congratulations! Your project has been reviewed and approved.",
    panelClassName: "bg-surface-container-low",
    iconBoxClassName: "bg-primary text-on-primary",
  },
  REJECTED: {
    icon: "cancel",
    title: "Changes required",
    body: "Your project was reviewed but did not meet all required benchmark criteria.",
    bodyWithFeedback: " Read the mentor notes below.",
    panelClassName: "bg-error-container/40",
    iconBoxClassName: "bg-error-container text-error",
  },
};

/** The four lifecycle stages, in order. */
const LIFECYCLE_STAGES = ["Submitted", "In Queue", "Evaluation", "Decision"] as const;

type StageState = "complete" | "active" | "todo";

/**
 * Derives the lifecycle stage states from the submission status.
 *
 * The stages are a visualisation of the status the server returned — no
 * timeline data is invented.
 */
function deriveStageStates(status: SubmissionStatus): StageState[] {
  if (status === "PENDING") {
    return ["complete", "active", "todo", "todo"];
  }
  return ["complete", "complete", "complete", "complete"];
}

/**
 * Read-only view of the student's submitted project.
 *
 * Replaces the submission form once the server confirms the submission, and
 * is also what a student sees after a refresh or a new session.
 */
export function SubmittedProjectCard({ submission }: { submission: Submission }) {
  const panel = STATUS_PANEL[submission.status] ?? STATUS_PANEL.PENDING;
  const stageStates = deriveStageStates(submission.status);

  return (
    <div className="flex flex-col gap-6">
      {/* Status Panel */}
      <div
        className={`relative overflow-hidden rounded-xl p-6 md:p-8 shadow-sm flex flex-col gap-6 ${panel.panelClassName}`}
      >
        <div
          className="absolute -right-8 -top-8 size-44 rounded-full bg-surface-container blur-2xl pointer-events-none opacity-60"
          aria-hidden="true"
        />

        <div className="flex items-start gap-4 relative z-10">
          <div
            className={`size-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${panel.iconBoxClassName}`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              aria-hidden="true"
            >
              {panel.icon}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-headline-md text-on-surface">{panel.title}</h2>
              <SubmissionStatusBadge status={submission.status} />
            </div>
            <p className="text-body-md text-on-surface-variant">
              {panel.body}
              {submission.feedback ? panel.bodyWithFeedback : null}
            </p>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="pt-6 bg-surface-container-lowest/80 backdrop-blur-sm rounded-lg p-4">
          <div className="text-label-sm text-code-sm text-secondary uppercase tracking-wider mb-4">
            Verification &amp; Lifecycle Audit Trail
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {LIFECYCLE_STAGES.map((stage, index) => {
              const state = stageStates[index];

              return (
                <li key={stage} className="flex flex-col gap-1 relative">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-6 rounded-full flex items-center justify-center text-[13px] ${
                        state === "todo"
                          ? "bg-surface-container-high text-secondary"
                          : state === "active"
                            ? "bg-primary-container text-on-primary shadow-sm"
                            : "bg-primary text-on-primary"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[14px]"
                        aria-hidden="true"
                      >
                        {state === "complete" ? "done" : state === "active" ? "check" : "more_horiz"}
                      </span>
                    </div>
                    <span
                      className={`text-label-md font-semibold ${
                        state === "todo" ? "text-secondary" : "text-on-surface"
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                  <span className="text-label-sm text-secondary pl-8 sm:pl-0 sm:pt-1">
                    {state === "complete"
                      ? "Completed"
                      : state === "active"
                        ? "In progress"
                        : "Upcoming"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Read-only lock notice */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/60 text-on-surface">
          <span
            className="material-symbols-outlined text-secondary text-[16px]"
            aria-hidden="true"
          >
            lock
          </span>
          <span className="text-body-sm text-on-surface-variant">
            Projects cannot be edited after submission. Your record is sealed
            once a mentor completes the review.
          </span>
        </div>
      </div>

      {/* Submission Details */}
      <div className="rounded-xl bg-surface-container-lowest p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-code-sm text-secondary">
            <span className="px-2 py-0.5 rounded bg-surface-container font-medium text-on-surface">
              #{submission.id.slice(0, 8).toUpperCase()}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatUtcDateTime(submission.createdAt)}</span>
          </div>
          <SubmissionStatusBadge status={submission.status} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-headline-lg text-on-surface tracking-tight">
            {submission.projectName}
          </h3>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">
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

      {/* Mentor Feedback — only rendered once the backend exposes it */}
      {submission.feedback && (
        <div className="rounded-xl bg-surface-container-lowest p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                >
                  rate_review
                </span>
              </div>
              <div>
                <h3 className="text-headline-sm text-on-surface">
                  Mentor Feedback
                </h3>
                <p className="text-label-sm text-secondary">
                  Verified assessment record
                </p>
              </div>
            </div>
            {submission.reviewedAt && (
              <span className="text-code-sm text-secondary">
                Reviewed {formatUtcDateTime(submission.reviewedAt)}
              </span>
            )}
          </div>

          <div className="relative bg-surface-container-low/70 p-6 rounded-r-lg rounded-l-none pl-10">
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l"
              aria-hidden="true"
            />
            <p className="text-body-md text-on-surface italic leading-relaxed">
              {submission.feedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Read-only card linking to the repository or the deployed project. */
function ExternalLinkCard({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="size-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface shrink-0">
          <span
            className="material-symbols-outlined text-[18px]"
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors">
            {title}
          </span>
          <span className="text-code-sm text-secondary truncate">
            {formatUrlLabel(href)}
          </span>
        </div>
      </div>
      <span
        className="material-symbols-outlined text-secondary group-hover:text-primary text-[18px] shrink-0 ml-2"
        aria-hidden="true"
      >
        open_in_new
      </span>
    </a>
  );
}

/** Snapshot of the identifiers and timestamps belonging to the submission. */
export function SubmissionSnapshotCard({ submission }: { submission: Submission }) {
  const meta = getSubmissionStatusMeta(submission.status);

  const rows: Array<{ label: string; value: string }> = [
    { label: "Submission ID", value: submission.id.slice(0, 8).toUpperCase() },
    { label: "Submitted", value: formatUtcDateTime(submission.createdAt) },
    { label: "Status", value: meta.label },
  ];

  if (submission.reviewedAt) {
    rows.push({ label: "Reviewed", value: formatUtcDateTime(submission.reviewedAt) });
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-4">
      <h3 className="text-label-md text-on-surface font-bold">
        Submission Snapshot
      </h3>
      <dl className="flex flex-col gap-3 text-label-md">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="text-on-surface-variant">{row.label}</dt>
            <dd className="text-code-sm text-on-surface text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
