"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmissionStatusBadge } from "@/components/submissions";
import { formatUrlLabel, formatUtcDateTime } from "@/lib/format";
import type { MentorSubmission, ReviewDecision } from "@/lib/api/mentor-submissions";

export interface ReviewDrawerProps {
  /** The submission under review. `null` keeps the drawer closed. */
  submission: MentorSubmission | null;
  /** Whether the drawer is open. */
  open: boolean;
  /** Called when the drawer opens or closes. */
  onOpenChange: (open: boolean) => void;
  /** The feedback the mentor has written. */
  feedback: string;
  /** Called whenever the feedback changes. */
  onFeedbackChange: (value: string) => void;
  /** Records the decision for the submission. */
  onSubmit: (decision: ReviewDecision) => void;
  /** True while the decision is being sent. */
  isSubmitting: boolean;
  /** The message of the last failed request. */
  error: string | null;
}

/**
 * The review drawer.
 *
 * It shows everything a mentor needs to judge a submission and records the
 * decision against the submission's stable id.
 */
export function ReviewDrawer({
  submission,
  open,
  onOpenChange,
  feedback,
  onFeedbackChange,
  onSubmit,
  isSubmitting,
  error,
}: ReviewDrawerProps) {
  if (!submission) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
              <span className="text-code-sm text-primary font-semibold">
                Submission Audit
              </span>
              <span className="text-outline" aria-hidden="true">
                /
              </span>
              <span className="text-code-sm text-on-surface font-medium">
                #{submission.id.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <SubmissionStatusBadge status={submission.status} />
              <SheetClose
                className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                aria-label="Close the review drawer"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                >
                  close
                </span>
              </SheetClose>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {/*
              The catalog code and the attempt are the two things that tell
              a mentor which project, and which hand-in of it, they are
              looking at. The table shows both, and the drawer has to agree
              with it — a resubmission is reviewed as an attempt, not as a
              fresh submission.
            */}
            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle>{submission.projectName}</SheetTitle>
              <span className="px-2 py-0.5 rounded bg-surface-container font-code-sm text-code-sm uppercase font-semibold text-secondary">
                {submission.projectId}
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm">
                Attempt {submission.attempt}
              </span>
            </div>
            <SheetDescription>
              {submission.student.fullName} · {submission.student.email}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          <section className="rounded-xl border border-surface-container bg-surface-container-low/60 p-4">
            <SectionHeading icon="person">Student &amp; Submission Metadata</SectionHeading>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Metadata label="Student Name" value={submission.student.fullName} />
              <Metadata label="Student Email" value={submission.student.email} mono />
              <Metadata
                label="Submitted Timestamp"
                value={formatUtcDateTime(submission.submittedAt)}
                mono
              />
              <Metadata
                label="Repository"
                value={formatUrlLabel(submission.repoUrl)}
                mono
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeading icon="link">Deliverables &amp; Artifacts</SectionHeading>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DeliverableCard
                icon="code"
                title="Source Repository"
                value={formatUrlLabel(submission.repoUrl)}
                href={submission.repoUrl}
                action="Open Repository"
              />
              {submission.liveUrl ? (
                <DeliverableCard
                  icon="public"
                  title="Live Deployment"
                  value={formatUrlLabel(submission.liveUrl)}
                  href={submission.liveUrl}
                  action="Open Live Project"
                />
              ) : null}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <SectionHeading icon="description">Project Description</SectionHeading>
            <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-4 shadow-[var(--shadow-1)]">
              <p className="text-body-md leading-relaxed text-on-surface">
                {submission.description}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-3.5">
            <SectionHeading icon="rate_review">Review Information &amp; Feedback</SectionHeading>

            <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-surface-container bg-surface-container-low/60 p-3.5 sm:grid-cols-4">
              <Metadata label="Status" value={submission.status} mono />
              <Metadata
                label="Reviewed At"
                value={formatUtcDateTime(submission.reviewedAt)}
                mono
              />
              <Metadata
                label="Current Decision"
                value={submission.status === "PENDING" ? "Not reviewed" : "Recorded"}
              />
              <Metadata
                label="Existing Feedback"
                value={submission.feedback ? "On file" : "None"}
              />
            </div>

            {submission.feedback ? (
              <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-4">
                <p className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Previous feedback
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-body-sm text-on-surface">
                  {submission.feedback}
                </p>
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="review-feedback">
                Mentor Evaluation Notes
              </FieldLabel>
              <Textarea
                id="review-feedback"
                value={feedback}
                onChange={(event) => onFeedbackChange(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Add review feedback, rubric comments, or requested changes for this submission..."
                className="mt-1.5 bg-surface-container-lowest text-body-sm"
              />
            </Field>

            {error ? (
              <Alert variant="destructive">
                <span
                  className="material-symbols-outlined text-[16px]"
                  aria-hidden="true"
                >
                  error
                </span>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </section>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onSubmit("REJECTED")}
            disabled={isSubmitting}
            className="border-error/40 text-error hover:bg-error/10"
          >
            {isSubmitting ? (
              <Spinner />
            ) : (
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                cancel
              </span>
            )}
            Reject
          </Button>

          <Button
            onClick={() => onSubmit("APPROVED")}
            disabled={isSubmitting}
            className="bg-status-approved-dot hover:bg-status-approved-dot/90"
          >
            {isSubmitting ? (
              <Spinner />
            ) : (
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                check_circle
              </span>
            )}
            Approve
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** A titled section heading with an icon. */
function SectionHeading({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
      <span
        className="material-symbols-outlined text-[16px] text-primary"
        aria-hidden="true"
      >
        {icon}
      </span>
      {children}
    </h3>
  );
}

/** A single label/value pair. */
function Metadata({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-body-sm text-on-surface-variant">
        {label}
      </span>
      <span
        className={
          mono
            ? "mt-0.5 break-words text-code-sm text-on-surface font-medium"
            : "mt-0.5 text-label-md text-on-surface font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}

/** A card describing one deliverable, with a link to open it. */
function DeliverableCard({
  icon,
  title,
  value,
  href,
  action,
}: {
  icon: string;
  title: string;
  value: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border border-surface-container bg-surface-container-lowest p-3.5 shadow-[var(--shadow-1)]">
      <div className="flex items-start gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-on-surface">
          <span
            className="material-symbols-outlined text-[18px]"
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-label-md text-on-surface font-semibold">
            {title}
          </div>
          <div className="truncate text-code-sm text-on-surface-variant">
            {value}
          </div>
        </div>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-1.5 text-label-md text-on-surface font-medium transition-colors hover:bg-surface-container"
      >
        {action}
        <span
          className="material-symbols-outlined text-[15px]"
          aria-hidden="true"
        >
          open_in_new
        </span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}
