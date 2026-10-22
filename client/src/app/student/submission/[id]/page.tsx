"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { useSubmissionById, useResubmitSubmission } from "@/hooks/use-submissions";
import { AppFooter, AppHeader } from "@/components/layout";
import {
  SubmissionDetailHeader,
  SubmissionIntegrityChecks,
  SubmissionRubricBreakdown,
  LifecycleStepper,
  MentorFeedbackCard,
  ExternalLinkCard,
  AcademicIntegrityCard,
  SubmissionSnapshotCard,
} from "@/components/student";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiRequestError } from "@/lib/api/client";
import type { Submission } from "@/lib/api/submissions";
import { formatUtcDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Student submission detail page.
 *
 * Renders different views based on submission status:
 * - PENDING: Waiting for review, lifecycle stepper, integrity checks
 * - REJECTED: Changes required, mentor feedback, rubric breakdown, resubmit
 * - APPROVED: Approved, score, mentor feedback, rubric, links
 */
export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isResolving: isUserResolving } = useCurrentUser();
  const submissionId = params.id as string;

  const [isResubmitting, setIsResubmitting] = useState(false);

  const {
    data: submission,
    isPending: isSubmissionPending,
    isError: isSubmissionError,
    error: submissionError,
  } = useSubmissionById(submissionId);

  const resubmitMutation = useResubmitSubmission();

  // Handle 401/404 errors
  // Note: The API returns 401 for unauthenticated, but 404 would be handled by the query
  // since we fetch all and filter. We'll check for null submission after load.

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
                <Link href={`/auth?tab=login&redirectTo=/student/submission/${submissionId}`} />
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
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
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

  const status = submission.status;
  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED";
  const isRejected = status === "REJECTED";

  // Prepare rubric data with scores (mock data for approved/rejected - in real app this comes from API)
  const rubricCriteria = isApproved
    ? [
        { name: "Architectural Soundness", maxPoints: 40, earnedPoints: 38, description: "Database schema, separation of concerns & API design", feedback: "Excellent schema design with proper indexing. Minor: consider adding foreign key constraints." },
        { name: "Deployment & Stability", maxPoints: 30, earnedPoints: 28, description: "Live URL accessibility, error handling & SSL setup", feedback: "Deployed successfully with HTTPS. Error boundaries in place. SSL certificate valid." },
        { name: "Git Hygiene & History", maxPoints: 20, earnedPoints: 18, description: "Atomic commits, clear messages & conventional syntax", feedback: "Good commit hygiene. Some merge commits could be rebased for cleaner history." },
        { name: "Performance & A11y", maxPoints: 10, earnedPoints: 10, description: "Lighthouse score >90 & keyboard navigable layouts", feedback: "Perfect score. All a11y checks pass, Lighthouse 98/100." },
      ]
    : isRejected
    ? [
        { name: "Architectural Soundness", maxPoints: 40, earnedPoints: 22, description: "Database schema, separation of concerns & API design", feedback: "Missing proper indexing on foreign keys. API lacks versioning. Service layer not separated from controllers." },
        { name: "Deployment & Stability", maxPoints: 30, earnedPoints: 15, description: "Live URL accessibility, error handling & SSL setup", feedback: "Live URL returns 500 on /api routes. No error boundaries. SSL not configured." },
        { name: "Git Hygiene & History", maxPoints: 20, earnedPoints: 12, description: "Atomic commits, clear messages & conventional syntax", feedback: "Many 'wip' commits. Large commits mixing features. No conventional commit format." },
        { name: "Performance & A11y", maxPoints: 10, earnedPoints: 4, description: "Lighthouse score >90 & keyboard navigable layouts", feedback: "Lighthouse 62/100. Missing alt text, focus indicators, and ARIA labels." },
      ]
    : undefined;

  const totalScore = isApproved ? 94 : isRejected ? 53 : undefined;

  const handleResubmit = async (values: {
    repoUrl: string;
    liveUrl: string;
    description: string;
  }) => {
    setIsResubmitting(true);
    try {
      await resubmitMutation.mutateAsync({
        submissionId: submission.id,
        payload: values,
      });
      router.refresh();
    } catch (error) {
      console.error("Resubmission failed:", error);
    } finally {
      setIsResubmitting(false);
    }
  };

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
              {/* Lifecycle Stepper */}
              <LifecycleStepper status={status} />

              {isPending && (
                <>
                  {/* Waiting for Review Card */}
                  <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <span
                          className="material-symbols-outlined text-amber-600 text-[24px]"
                          aria-hidden="true"
                        >
                          hourglass_top
                        </span>
                      </div>
                      <div>
                        <h3 className="text-headline-sm text-on-surface">
                          Waiting for Mentor Review
                        </h3>
                        <p className="text-body-md text-on-surface-variant">
                          Your submission is in the review queue. A mentor will evaluate
                          your project against the rubric and provide feedback.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-surface-container-high/60">
                      <span className="text-label-md text-on-surface-variant">Queue Position:</span>
                      <span className="text-headline-sm font-bold text-primary">#3</span>
                      <span className="text-body-sm text-secondary">Estimated wait: ~2-3 business days</span>
                    </div>
                  </div>

                  {/* Integrity Checks */}
                  <SubmissionIntegrityChecks />
                </>
              )}

              {isRejected && (
                <>
                  {/* Changes Required Alert */}
                  <Alert variant="destructive" className="border-error/30">
                    <span
                      className="material-symbols-outlined text-[20px] shrink-0"
                      aria-hidden="true"
                    >
                      error
                    </span>
                    <div>
                      <AlertTitle>Changes Required</AlertTitle>
                      <AlertDescription>
                        Your submission did not meet the passing threshold. Review the mentor
                        feedback and rubric breakdown below, then resubmit with the required
                        improvements.
                      </AlertDescription>
                    </div>
                  </Alert>

                  {/* Mentor Feedback */}
                  <MentorFeedbackCard submission={submission} />

                  {/* Rubric Breakdown */}
                  <SubmissionRubricBreakdown
                    criteria={rubricCriteria}
                    totalScore={totalScore}
                    isRejected={true}
                  />

                  {/* Resubmit Section */}
                  <ResubmitSection
                    submission={submission}
                    onResubmit={handleResubmit}
                    isResubmitting={isResubmitting || resubmitMutation.isPending}
                  />
                </>
              )}

              {isApproved && (
                <>
                  {/* Approved Celebration */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <span
                          className="material-symbols-outlined text-emerald-600 text-[28px]"
                          aria-hidden="true"
                        >
                          verified
                        </span>
                      </div>
                      <div>
                        <h3 className="text-headline-md text-emerald-900">
                          Submission Approved!
                        </h3>
                        <p className="text-body-md text-emerald-800">
                          Congratulations! Your project has passed the evaluation with a score
                          of <strong>94/100</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-emerald-200">
                      <span className="text-label-md text-emerald-700">Approved on:</span>
                      <span className="text-headline-sm font-bold text-emerald-900">
                        {submission.reviewedAt
                          ? formatUtcDateTime(submission.reviewedAt).split(",")[0]
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Mentor Feedback */}
                  <MentorFeedbackCard submission={submission} />

                  {/* Rubric Breakdown */}
                  <SubmissionRubricBreakdown
                    criteria={rubricCriteria}
                    totalScore={totalScore}
                  />
                </>
              )}

              {/* External Links - always shown */}
              <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-4">
                <h3 className="text-label-md text-on-surface font-bold">
                  Project Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ExternalLinkCard
                    href={submission.repoUrl}
                    title="GitHub Repository"
                    icon="code"
                  />
                  <ExternalLinkCard
                    href={submission.liveUrl}
                    title="Live Project"
                    icon="public"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="flex flex-col gap-6">
              {/* Submission Snapshot */}
              <SubmissionSnapshotCard submissions={[submission]} />

              {/* Integrity Checks (compact) for pending */}
              {isPending && (
                <SubmissionIntegrityChecks compact />
              )}

              {/* Rubric Summary for reviewed */}
              {(isApproved || isRejected) && (
                <SubmissionRubricBreakdown
                  criteria={rubricCriteria}
                  totalScore={totalScore}
                  isRejected={isRejected}
                />
              )}

              {/* Academic Integrity Card */}
              <AcademicIntegrityCard />
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

/** Resubmit section for rejected submissions. */
function ResubmitSection({
  submission,
  onResubmit,
  isResubmitting,
}: {
  submission: Submission;
  onResubmit: (values: { repoUrl: string; liveUrl: string; description: string }) => void;
  isResubmitting: boolean;
}) {
  const [repoUrl, setRepoUrl] = useState(submission.repoUrl);
  const [liveUrl, setLiveUrl] = useState(submission.liveUrl || "");
  const [description, setDescription] = useState(submission.description);
  const [errors, setErrors] = useState<Partial<Record<"repoUrl" | "liveUrl" | "description", string>>>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!repoUrl.trim()) {
      newErrors.repoUrl = "Repository URL is required";
    } else if (!/^https?:\/\/github\.com\//.test(repoUrl)) {
      newErrors.repoUrl = "Must be a GitHub URL (github.com)";
    }
    if (liveUrl && !/^https?:\/\//.test(liveUrl)) {
      newErrors.liveUrl = "Must be a valid URL";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onResubmit({ repoUrl, liveUrl, description });
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-primary text-[24px]"
            aria-hidden="true"
          >
            upload_file
          </span>
        </div>
        <div>
          <h3 className="text-headline-sm text-on-surface">
            Resubmit Deliverable
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Update your repository and live URL, then submit for re-evaluation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="resubmit-repo" className="block text-label-sm font-medium text-on-surface mb-1">
            Git Repository URL
          </label>
          <input
            id="resubmit-repo"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/project-name"
            className={cn(
              "w-full h-10 pl-9 pr-3 bg-surface-container-lowest border rounded-lg text-on-surface font-code-sm text-code-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
              errors.repoUrl && "border-error focus:ring-error/20",
            )}
            disabled={isResubmitting}
            aria-invalid={!!errors.repoUrl}
            aria-describedby={errors.repoUrl ? "repo-error" : undefined}
          />
          <span className="absolute -translate-y-1/2 left-3 top-1/2 material-symbols-outlined text-secondary text-[18px]" aria-hidden="true">code</span>
          {errors.repoUrl && (
            <p id="repo-error" className="mt-1 text-label-sm text-error" role="alert">
              {errors.repoUrl}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="resubmit-live" className="block text-label-sm font-medium text-on-surface mb-1">
            Live Project URL (Optional)
          </label>
          <input
            id="resubmit-live"
            type="url"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            placeholder="https://your-project.vercel.app"
            className={cn(
              "w-full h-10 pl-9 pr-3 bg-surface-container-lowest border rounded-lg text-on-surface font-code-sm text-code-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors",
              errors.liveUrl && "border-error focus:ring-error/20",
            )}
            disabled={isResubmitting}
            aria-invalid={!!errors.liveUrl}
            aria-describedby={errors.liveUrl ? "live-error" : undefined}
          />
          <span className="absolute -translate-y-1/2 left-3 top-1/2 material-symbols-outlined text-secondary text-[18px]" aria-hidden="true">public</span>
          {errors.liveUrl && (
            <p id="live-error" className="mt-1 text-label-sm text-error" role="alert">
              {errors.liveUrl}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="resubmit-desc" className="block text-label-sm font-medium text-on-surface mb-1">
            Description / Changes Made
          </label>
          <textarea
            id="resubmit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you changed since the last attempt..."
            rows={3}
            className={cn(
              "w-full h-24 pl-3 pr-3 py-2 bg-surface-container-lowest border rounded-lg text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none",
              errors.description && "border-error focus:ring-error/20",
            )}
            disabled={isResubmitting}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "desc-error" : undefined}
          />
          {errors.description && (
            <p id="desc-error" className="mt-1 text-label-sm text-error" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <div className="p-3 rounded-lg bg-surface-container flex items-start gap-3">
          <span
            className="material-symbols-outlined text-secondary text-[18px] mt-0.5"
            aria-hidden="true"
          >
            verified_user
          </span>
          <p className="font-body-sm text-body-sm text-secondary">
            By resubmitting, you certify that all source commits comply with
            ProjectHub Code Integrity Standards and Academic Honor Code.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isResubmitting}
          className="w-full py-2 rounded-lg font-label-md text-label-md bg-primary-container text-on-primary hover:bg-primary transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {isResubmitting ? (
            <>
              <span
                className="material-symbols-outlined text-[18px] animate-spin"
                aria-hidden="true"
              >
                sync
              </span>
              Resubmitting…
            </>
          ) : (
            <>
              Resubmit for Review
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                arrow_forward
              </span>
            </>
          )}
        </Button>
      </form>
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
            <div key={i} className="h-20 bg-surface-container-highest rounded-lg" />
          ))}
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 animate-pulse">
        <div className="h-4 w-48 bg-surface-container-highest rounded mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-container-highest rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 h-32 animate-pulse" />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-6 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    </>
  );
}