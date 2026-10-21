"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { useMySubmissions } from "@/hooks/use-submissions";
import { AppFooter, AppHeader } from "@/components/layout";
import {
  EvaluationRubricCard,
  MentorFeedbackCard,
  ResubmitForm,
  SubmissionDetailsCard,
  SubmissionEmptyState,
  SubmissionLoadError,
  SubmissionSkeleton,
  SubmissionSnapshotCard,
  SubmissionStatusBadge,
  SubmissionStatusPanel,
} from "@/components/student";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/lib/api/client";
import type { Submission } from "@/lib/api/submissions";
import { formatUtcDateTime } from "@/lib/format";

/**
 * The student's own submissions.
 *
 * The page is a read-only view: everything it shows comes from
 * `GET /api/submissions/me`, and the loading, empty and error states are kept
 * apart so "there is no submission" never looks like "the request failed".
 *
 * A student may hold one submission per catalog project, so the page renders
 * a block per submission rather than a single record.
 */
export default function StudentSubmissionPage() {
  const router = useRouter();
  const { user, isResolving: isUserResolving } = useCurrentUser();
  const {
    data: submissions = [],
    isPending: isSubmissionPending,
    isError: isSubmissionError,
    error: submissionError,
    refetch: refetchSubmissions,
    isFetching: isRefetching,
  } = useMySubmissions();

  // An expired session is handled by the authentication flow, not by the page.
  useEffect(() => {
    if (
      submissionError instanceof ApiRequestError &&
      submissionError.status === 401
    ) {
      router.replace("/auth?tab=login&redirectTo=/student/submission");
    }
  }, [submissionError, router]);

  if (isUserResolving) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 w-full pt-16">
          <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6">
            <PageHeaderSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-8">
              <div className="lg:col-span-7">
                <SubmissionSkeleton />
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6">
                <PanelSkeleton />
                <PanelSkeleton />
              </div>
            </div>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 w-full pt-16 flex items-center justify-center px-6">
          <div className="max-w-md text-center flex flex-col gap-4">
            <span
              className="material-symbols-outlined text-[32px] text-outline mx-auto"
              aria-hidden="true"
            >
              lock
            </span>
            <h1 className="text-headline-md text-on-surface">
              Please sign in to view your submissions
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Your session is missing or has expired. Sign in again to continue
              with your project submissions.
            </p>
            <Button
              render={
                <Link href="/auth?tab=login&redirectTo=/student/submission" />
              }
              className="self-center"
            >
              Sign in
            </Button>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 w-full pt-16">
        <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6">
          <PageHeader submissions={submissions} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-8">
            <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
              {isSubmissionPending ? (
                <SubmissionSkeleton />
              ) : isSubmissionError ? (
                <SubmissionLoadError
                  error={submissionError}
                  onRetry={() => void refetchSubmissions()}
                  isRetrying={isRefetching}
                />
              ) : submissions.length === 0 ? (
                <SubmissionEmptyState />
              ) : (
                submissions.map((submission) => (
                  <SubmissionBlock
                    key={submission.id}
                    submission={submission}
                  />
                ))
              )}
            </div>

            <aside className="lg:col-span-5 flex flex-col gap-6">
              {submissions.length > 0 ? (
                <SubmissionSnapshotCard submissions={submissions} />
              ) : (
                <PreflightHint />
              )}

              <EvaluationRubricCard />

              <div className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 flex items-center justify-between font-body-sm text-body-sm text-secondary">
                <span>Daily mentor office hours at 17:00 UTC.</span>
                <span className="font-code-sm text-code-sm text-primary font-medium">
                  Discord #triage
                </span>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

/**
 * One submission, in full.
 *
 * The project the submission belongs to is named in the block header, so a
 * student with several submissions can tell them apart without reading every
 * card.
 */
function SubmissionBlock({ submission }: { submission: Submission }) {
  const isRejected = submission.status === "REJECTED";

  return (
    <section className="flex flex-col gap-6" aria-labelledby={`submission-${submission.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-code-sm text-code-sm font-semibold uppercase text-secondary">
            {submission.projectId}
          </span>
          <h2
            id={`submission-${submission.id}`}
            className="text-headline-lg text-on-surface tracking-tight truncate"
          >
            {submission.projectName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm">
            Attempt {submission.attempt}
          </span>
          <SubmissionStatusBadge status={submission.status} />
        </div>
      </div>

      <SubmissionStatusPanel
        status={submission.status}
        hasFeedback={Boolean(submission.feedback?.trim())}
        attempt={submission.attempt}
      />

      <SubmissionDetailsCard submission={submission} />

      <MentorFeedbackCard submission={submission} />

      {isRejected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest p-5">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="material-symbols-outlined text-error text-[20px] shrink-0"
              aria-hidden="true"
            >
              sync
            </span>
            <p className="text-body-sm text-on-surface-variant">
              Changes were requested. Resubmit this project to send attempt{" "}
              {submission.attempt + 1} for review.
            </p>
          </div>
          <ResubmitForm submission={submission} />
        </div>
      ) : null}
    </section>
  );
}

/**
 * Page header with the current submission state.
 *
 * Every value shown here comes from the server.
 */
function PageHeader({ submissions }: { submissions: Submission[] }) {
  const hasSubmission = submissions.length > 0;
  const latest = submissions[0];

  return (
    <header className="pb-8 border-b border-surface-container-high/60">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 font-code-sm text-code-sm text-on-surface-variant">
          <span>Student Portal</span>
          <span className="text-outline" aria-hidden="true">
            /
          </span>
          <span className="text-on-surface font-medium">Your Submissions</span>
        </div>

        {hasSubmission ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-surface-container-high/60 font-code-sm text-code-sm text-secondary uppercase tracking-wider">
              <span
                className="material-symbols-outlined text-[14px]"
                aria-hidden="true"
              >
                lock
              </span>
              Locked
            </span>
            <SubmissionStatusBadge status={latest!.status} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {hasSubmission ? (
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-code-sm text-code-sm text-secondary">
                {submissions.length}{" "}
                {submissions.length === 1 ? "project" : "projects"} submitted
              </span>
              <span className="text-outline font-code-sm text-code-sm" aria-hidden="true">
                ·
              </span>
              <span className="font-code-sm text-code-sm text-secondary">
                Latest {formatUtcDateTime(latest!.submittedAt)}
              </span>
            </div>
          ) : null}

          <h1 className="text-display text-on-surface font-bold tracking-tight">
            Your Submissions
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1.5">
            {hasSubmission
              ? "The record of every project you handed in, together with its review status and the mentor's assessment."
              : "You haven't submitted a project yet. Your project details and mentor feedback will appear here once you hand it in."}
          </p>
        </div>
      </div>
    </header>
  );
}

/** Sidebar hint shown while the student has no submission. */
function PreflightHint() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-3">
      <h3 className="text-label-md text-on-surface font-bold">
        Before You Submit
      </h3>
      <ul className="flex flex-col gap-2 text-body-sm text-on-surface-variant list-disc pl-4">
        <li>Point the repository link at the source of the project.</li>
        <li>Make sure the live deployment matches the submitted commit.</li>
        <li>Describe the problem the project solves, not just the stack.</li>
      </ul>
    </div>
  );
}

/** Loading placeholder for a sidebar panel. */
function PanelSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-4">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-3 w-24" />
      <div className="flex flex-col gap-3 pt-1">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Loading placeholder for the page header. */
function PageHeaderSkeleton() {
  return (
    <div className="pb-8 border-b border-surface-container-high/60 flex flex-col gap-4">
      <Skeleton className="h-3 w-48" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    </div>
  );
}
