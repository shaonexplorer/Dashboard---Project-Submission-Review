"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { useMySubmissions } from "@/hooks/use-submissions";
import { AppFooter, AppHeader } from "@/components/layout";
import {
  EvaluationRubricCard,
  PreflightCriteriaCard,
  StudentSubmissionForm,
  SubmissionSnapshotCard,
} from "@/components/student";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/lib/api/client";
import type { Submission } from "@/lib/api/submissions";
import { formatUtcDateTime } from "@/lib/format";

export default function StudentDashboardPage() {
  const router = useRouter();
  // `isResolving` covers both the server render and the first client render,
  // so the two always produce the same markup.
  const { user, isResolving: isUserResolving } = useCurrentUser();
  const { data: submissions = [], error: submissionError } = useMySubmissions();

  // console.log({ user });

  // An expired session is handled by the authentication flow, not by the page.
  useEffect(() => {
    if (
      submissionError instanceof ApiRequestError &&
      submissionError.status === 401
    ) {
      router.replace("/auth?tab=login&redirectTo=/student/dashboard");
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
                <FormSkeleton />
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
              Please sign in to access the dashboard
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Your session is missing or has expired. Sign in again to continue
              with your project submission.
            </p>
            <Button
              render={
                <Link href="/auth?tab=login&redirectTo=/student/dashboard" />
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

          {/* Submission policy */}
          <div className="p-4 rounded-lg bg-surface-container-lowest border border-surface-container-high/80 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="material-symbols-outlined text-primary text-[20px] shrink-0"
                aria-hidden="true"
              >
                info
              </span>
              <p className="text-body-sm text-on-surface-variant">
                <strong className="text-on-surface font-medium">
                  One Submission per Project:
                </strong>{" "}
                You may hand in any project from the catalog, once per project.
                If a project comes back rejected, you can resubmit it.
              </p>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-8">
            <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
              <StudentSubmissionForm />
            </div>

            <aside className="lg:col-span-5 flex flex-col gap-6">
              {submissions.length > 0 ? (
                <SubmissionSnapshotCard submissions={submissions} />
              ) : (
                <PreflightCriteriaCard />
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
 * Page header with the current submission state.
 *
 * Every value shown here comes from the server — no cohort, deadline or mentor
 * assignment is invented.
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
          <span className="text-on-surface font-medium">
            Project Submission
          </span>
        </div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-low border border-surface-container-high/60 font-code-sm text-code-sm text-secondary uppercase tracking-wider">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hasSubmission ? "bg-primary" : "bg-secondary"
            }`}
            aria-hidden="true"
          />
          {hasSubmission ? "Submission Received" : "Awaiting Submission"}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-low border border-surface-container-high font-code-sm text-code-sm text-on-surface-variant">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  hasSubmission ? "bg-primary" : "bg-outline"
                }`}
                aria-hidden="true"
              />
              {hasSubmission
                ? `${submissions.length} submitted`
                : "Unsubmitted"}
            </span>
            {latest ? (
              <>
                <span
                  className="text-outline font-code-sm text-code-sm"
                  aria-hidden="true"
                >
                  ·
                </span>
                <span className="font-code-sm text-code-sm text-secondary">
                  Latest {formatUtcDateTime(latest.submittedAt)}
                </span>
              </>
            ) : null}
          </div>

          <h1 className="text-display text-on-surface font-bold tracking-tight">
            Project Submission
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1.5">
            {hasSubmission ? (
              <>
                Your projects have been handed in.{" "}
                <Link
                  href="/student/submission"
                  className="text-primary font-medium hover:underline"
                >
                  View the full submissions
                </Link>
                .
              </>
            ) : (
              "You haven't submitted a project yet. Pick one from the catalog below and hand it in."
            )}
          </p>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-4 px-4 py-3 rounded-lg bg-surface-container-lowest border border-surface-container-high/60">
          <div className="flex flex-col">
            <span className="font-code-sm text-code-sm text-secondary">
              PROJECTS SUBMITTED
            </span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              {submissions.length}
            </span>
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <span className="font-code-sm text-code-sm text-secondary">
              {hasSubmission ? "LATEST STATUS" : "REVIEW CYCLE"}
            </span>
            <span className="font-label-md text-label-md text-primary font-medium">
              {latest ? latest.status : "Standard"}
            </span>
          </div>
          <div className="flex flex-col items-center lg:items-start lg:col-span-1">
            <span className="font-code-sm text-code-sm text-secondary">
              {hasSubmission ? "LATEST SUBMITTED" : "NEXT DEADLINE"}
            </span>
            <span className="font-label-md text-label-md text-on-surface font-medium">
              {latest
                ? formatUtcDateTime(latest.submittedAt).split(",")[0]
                : "Dec 18, 2026"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Loading placeholder for the submission form. */
function FormSkeleton() {
  return (
    <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 p-6 sm:p-7 flex flex-col gap-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-surface-container-high/60">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>

      <div className="flex flex-col gap-5">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-surface-container-high/60 flex justify-end">
        <Skeleton className="h-9 w-36" />
      </div>
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
