import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/api/submissions";

export interface SubmissionStatusMeta {
  /** Human readable label derived from the backend status. */
  label: string;
  /** Sentence describing the current state of the submission. */
  description: string;
  /** Badge classes for this status. */
  badgeClassName: string;
  /** Colour of the status dot. */
  dotClassName: string;
}

/**
 * Presentation metadata for each status defined by the backend.
 *
 * The labels are derived from `SubmissionStatus` — the frontend never invents
 * a status of its own, it only maps the one the server returned.
 */
const STATUS_META: Record<SubmissionStatus, SubmissionStatusMeta> = {
  PENDING: {
    label: "Pending Review",
    description: "Your project is queued for mentor assessment.",
    badgeClassName:
      "bg-status-pending-bg border-status-pending-border text-status-pending-text",
    dotClassName: "bg-status-pending-dot",
  },
  APPROVED: {
    label: "Approved",
    description: "Your project has been reviewed and approved.",
    badgeClassName:
      "bg-status-approved-bg border-status-approved-border text-status-approved-text",
    dotClassName: "bg-status-approved-dot",
  },
  REJECTED: {
    label: "Changes Required",
    description: "Your project was reviewed and requires changes.",
    badgeClassName:
      "bg-status-rejected-bg border-status-rejected-border text-status-rejected-text",
    dotClassName: "bg-status-rejected-dot",
  },
};

/** Resolves the presentation metadata for a backend submission status. */
export function getSubmissionStatusMeta(status: SubmissionStatus): SubmissionStatusMeta {
  return STATUS_META[status] ?? STATUS_META.PENDING;
}

/** Visual badge for the current submission status. */
export function SubmissionStatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus;
  className?: string;
}) {
  const meta = getSubmissionStatusMeta(status);

  return (
    <Badge className={cn(meta.badgeClassName, className)}>
      <span
        className={cn("size-1.5 rounded-full", meta.dotClassName)}
        aria-hidden="true"
      />
      {meta.label}
    </Badge>
  );
}
