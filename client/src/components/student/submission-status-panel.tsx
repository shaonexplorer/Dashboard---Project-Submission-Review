import type { SubmissionStatus } from "@/lib/api/submissions";
import { LifecycleStepper } from "./lifecycle-stepper";
import { SubmissionStatusBadge } from "./submission-status-badge";

interface StatusPanel {
  icon: string;
  title: string;
  body: string;
  /**
   * Optional continuation used when the API actually exposes mentor feedback.
   * The default copy must not promise notes that are never rendered.
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

/**
 * Status banner for the submission.
 *
 * Combines the headline for the current status, the lifecycle stepper and the
 * read-only notice. The status itself always comes from the API — the banner
 * only describes it.
 */
export function SubmissionStatusPanel({
  status,
  hasFeedback,
}: {
  status: SubmissionStatus;
  /** Whether mentor feedback is available, used to refine the copy. */
  hasFeedback?: boolean;
}) {
  const panel = STATUS_PANEL[status] ?? STATUS_PANEL.PENDING;

  return (
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
            <SubmissionStatusBadge status={status} />
          </div>
          <p className="text-body-md text-on-surface-variant">
            {panel.body}
            {hasFeedback ? panel.bodyWithFeedback : null}
          </p>
        </div>
      </div>

      <LifecycleStepper status={status} />

      {/* Read-only lock notice */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/60 text-on-surface">
        <span
          className="material-symbols-outlined text-secondary text-[16px]"
          aria-hidden="true"
        >
          lock
        </span>
        <span className="text-body-sm text-on-surface-variant">
          Projects cannot be edited after submission. Your record is sealed once
          a mentor completes the review.
        </span>
      </div>
    </div>
  );
}
