"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-auth";
import { useSubmissionById } from "@/hooks/use-submissions";
import { AppFooter, AppHeader } from "@/components/layout";
import {
  SubmissionDetailHeader,
  SubmissionSnapshotCard,
  EvaluationRubricCard,
  SubmittedProjectCard,
} from "@/components/student";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api/client";

/**
 * Student submission detail page.
 *
 * Renders the submission detail view with:
 * - Submission header with status, breadcrumbs, and metadata
 * - Main column: SubmittedProjectCard (includes status, details, feedback, and resubmit action for rejected)
 * - Sidebar: SubmissionSnapshotCard, EvaluationRubricCard, and Discord link
 */
export default function SubmissionDetailPage() {
  const params = useParams();
  const { user, isResolving: isUserResolving } = useCurrentUser();
  const submissionId = params.id as string;

  const {
    data: submission,
    isPending: isSubmissionPending,
    isError: isSubmissionError,
    error: submissionError,
  } = useSubmissionById(submissionId);

  // Loading skeleton state
  if (isUserResolving) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 w-full pt-16">
          <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6 animate-pulse">
            <SubmissionDetailSkeleton />
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
              Please sign in to view this submission
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Your session is missing or has expired. Sign in again to continue.
            </p>
            <Button
              render={
                <Link
                  href={`/auth?tab=login&redirectTo=/student/submission/${submissionId}`}
                />
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

  if (isSubmissionPending) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 w-full pt-16">
          <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6 animate-pulse">
            <SubmissionDetailSkeleton />
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (isSubmissionError || !submission) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 w-full pt-16">
          <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6">
            <div className="text-center py-16">
              <span
                className="material-symbols-outlined text-[48px] text-outline mx-auto mb-4 block"
                aria-hidden="true"
              >
                error_outline
              </span>
              <h1 className="text-headline-md text-on-surface mb-2">
                Submission not found
              </h1>
              <p className="text-body-md text-on-surface-variant mb-6">
                {submissionError instanceof ApiRequestError
                  ? submissionError.message
                  : "This submission could not be found or you don't have permission to view it."}
              </p>
              <Button
                render={<Link href="/student/my-projects" />}
                className="w-fit mx-auto"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  aria-hidden="true"
                >
                  arrow_back
                </span>
                Back to My Projects
              </Button>
            </div>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  // At this point we have a valid submission object
  const status = submission.status;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="flex-1 w-full pt-16">
        <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6">
          {/* Header with status, breadcrumbs, metadata */}
          <SubmissionDetailHeader submission={submission} status={status} />

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column - 2/3 width */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Submission card with status, details, feedback, and resubmit if rejected */}
              <SubmittedProjectCard submission={submission} />
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="flex flex-col gap-6">
              {/* Submission Snapshot - wraps single submission in array */}
              <SubmissionSnapshotCard submissions={[submission]} />

              <EvaluationRubricCard />

              <div className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 flex items-center justify-between font-body-sm text-body-sm text-secondary">
                <span>Daily mentor office hours at 17:00 UTC.</span>
                <span className="font-code-sm text-code-sm text-primary font-medium">
                  Discord #triage
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

/** Skeleton for the detail page loading state. */
function SubmissionDetailSkeleton() {
  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-6 w-48 bg-surface-container-highest rounded" />
          <div className="h-8 w-64 bg-surface-container-highest rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-surface-container-highest rounded-lg"
            />
          ))}
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 animate-pulse">
        <div className="h-4 w-48 bg-surface-container-highest rounded mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-surface-container-highest rounded-lg"
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 h-32 animate-pulse"
            />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 h-32 animate-pulse"
            />
          ))}
        </div>
      </div>
    </>
  );
}