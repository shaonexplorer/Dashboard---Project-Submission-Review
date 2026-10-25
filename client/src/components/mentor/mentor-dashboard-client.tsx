"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";

import { useCurrentUser } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useMentorSubmissions,
  useReviewSubmission,
  useSubmissionStats,
} from "@/hooks/use-mentor-submissions";
import { AppFooter, AppHeader } from "@/components/layout";
import {
  MentorDashboardHeader,
  ReviewDrawer,
  SubmissionPagination,
  SubmissionStatsGrid,
  SubmissionStatsSkeleton,
  SubmissionTable,
  SubmissionTableEmpty,
  SubmissionTableSkeleton,
  SubmissionToolbar,
} from "@/components/mentor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/lib/api/client";
import type {
  MentorSubmission,
  ReviewDecision,
  SubmissionListQuery,
  SubmissionSortField,
  SubmissionSortOrder,
} from "@/lib/api/mentor-submissions";
import type { SubmissionStatus } from "@/lib/api/submissions";

/** Rows per page. The server enforces the same maximum. */
const PAGE_SIZE = 10;

/**
 * The sort the queue starts with.
 *
 * It matches the server's own default, so the first request and the header
 * indicators agree.
 */
const INITIAL_SORTING: SortingState = [{ id: "createdAt", desc: true }];

/**
 * The columns the server is able to sort by.
 *
 * The client never sends a field name outside this list, whatever the table
 * reports.
 */
const SORT_FIELDS: readonly SubmissionSortField[] = [
  "createdAt",
  "projectName",
  "status",
];

/** The whole state of the table, in one object. */
interface TableState {
  /** Zero-based page index. */
  pageIndex: number;
  /** The active status filter. `undefined` means "no restriction". */
  status: SubmissionStatus | undefined;
  /** The applied search term. */
  search: string;
  /** The active sorting. */
  sorting: SortingState;
}

const INITIAL_TABLE_STATE: TableState = {
  pageIndex: 0,
  status: undefined,
  search: "",
  sorting: INITIAL_SORTING,
};

/** Maps a table column id onto a field the server accepts. */
function toSortField(id: string | undefined): SubmissionSortField {
  return SORT_FIELDS.find((field) => field === id) ?? "createdAt";
}

/** True when two sorting states describe the same order. */
function isSameSorting(a: SortingState, b: SortingState): boolean {
  return (
    a.length === b.length &&
    a.every((entry, index) => {
      const other = b[index];
      return entry.id === other?.id && entry.desc === other?.desc;
    })
  );
}

interface MentorDashboardClientProps {
  /** Initial data from Server Component for hydration */
  initialSubmissions: MentorSubmission[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function MentorDashboardClient({
  initialSubmissions,
  initialPagination,
  initialStats,
}: MentorDashboardClientProps) {
  const router = useRouter();
  // `isResolving` covers the server render and the first client render, so the
  // two always produce the same markup.
  const { user, isResolving: isUserResolving } = useCurrentUser();

  const [tableState, setTableState] = useState<TableState>(INITIAL_TABLE_STATE);
  const [searchInput, setSearchInput] = useState("");
  const [activeSubmission, setActiveSubmission] =
    useState<MentorSubmission | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  // The search box is applied only after it has settled, so a request is made
  // once per search term rather than once per keystroke.
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  // The order the server is asked for. It is derived from the table's own
  // sorting state, so the sortable headers and the sort control always agree.
  const sortBy = toSortField(tableState.sorting[0]?.id);
  const sortOrder: SubmissionSortOrder =
    tableState.sorting[0]?.desc === false ? "asc" : "desc";

  const listQuery = useMemo<SubmissionListQuery>(
    () => ({
      page: tableState.pageIndex + 1,
      limit: PAGE_SIZE,
      search: tableState.search || undefined,
      status: tableState.status,
      sortBy,
      sortOrder,
    }),
    [
      tableState.pageIndex,
      tableState.search,
      tableState.status,
      sortBy,
      sortOrder,
    ],
  );

  const submissionsQuery = useMentorSubmissions(listQuery, {
    initialData: {
      submissions: initialSubmissions,
      pagination: initialPagination,
    },
  });
  const statsQuery = useSubmissionStats({
    initialData: initialStats,
  });
  const reviewMutation = useReviewSubmission();

  const submissions = submissionsQuery.data?.submissions ?? initialSubmissions;
  const pagination = submissionsQuery.data?.pagination ?? initialPagination;
  const stats = statsQuery.data ?? initialStats;

  // console.log({ submissions });

  // Apply the settled search term. The page returns to the first one, because
  // the previous page number has no meaning for a different result set.
  useEffect(() => {
    const trimmed = debouncedSearch.trim();

    setTableState((previous) => {
      if (previous.search === trimmed) {
        return previous;
      }

      return { ...previous, search: trimmed, pageIndex: 0 };
    });
  }, [debouncedSearch]);

  // Keep the page in step with the answer the server gave.
  //
  // The server answers with the page that was asked for, so this only matters
  // when that page no longer exists: the data set can shrink while the mentor
  // is on the last page — a submission they just reviewed leaves the active
  // filter — and the pager would then be stranded on an empty table. The last
  // page is taken from the server's own metadata, not from the rows on screen.
  //
  // While a new page is loading the table still shows the previous one, so its
  // pagination metadata belongs to the previous request. Acting on it would
  // undo the page the mentor just asked for.
  useEffect(() => {
    if (submissionsQuery.isPlaceholderData) {
      return;
    }

    const meta = submissionsQuery.data?.pagination;

    if (!meta) {
      return;
    }

    const lastPage = Math.max(1, meta.totalPages);
    const targetPage = Math.min(meta.page, lastPage);

    if (targetPage !== tableState.pageIndex + 1) {
      setTableState((previous) => ({ ...previous, pageIndex: targetPage - 1 }));
    }
  }, [
    submissionsQuery.data,
    submissionsQuery.isPlaceholderData,
    tableState.pageIndex,
  ]);

  // An expired session is handled by the authentication flow, not by the page.
  useEffect(() => {
    if (
      submissionsQuery.error instanceof ApiRequestError &&
      submissionsQuery.error.status === 401
    ) {
      router.replace("/auth?tab=login&redirectTo=/mentor/dashboard");
    }
  }, [submissionsQuery.error, router]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleStatusChange = (status: SubmissionStatus | undefined) => {
    setTableState((previous) => ({ ...previous, status, pageIndex: 0 }));
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setTableState((previous) => {
      const next =
        typeof updater === "function" ? updater(previous.sorting) : updater;

      if (isSameSorting(next, previous.sorting)) {
        return previous;
      }

      return { ...previous, sorting: next, pageIndex: 0 };
    });
  };

  const handleSortChange = (
    field: SubmissionSortField,
    order: SubmissionSortOrder,
  ) => {
    setTableState((previous) => {
      const nextSorting: SortingState = [{ id: field, desc: order === "desc" }];

      if (isSameSorting(nextSorting, previous.sorting)) {
        return previous;
      }

      // The page number means nothing for a different order, so the queue goes
      // back to the first page.
      return { ...previous, sorting: nextSorting, pageIndex: 0 };
    });
  };

  const handlePageChange = (page: number) => {
    setTableState((previous) => ({
      ...previous,
      pageIndex: Math.max(0, page - 1),
    }));
  };

  const handleReset = () => {
    setSearchInput("");
    setTableState((previous) => ({
      ...previous,
      search: "",
      status: undefined,
      pageIndex: 0,
    }));
  };

  const handleOpenReview = (submission: MentorSubmission) => {
    setActiveSubmission(submission);
    setFeedback(submission.feedback ?? "");
    reviewMutation.reset();
    setIsDrawerOpen(true);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);

    if (!open) {
      setFeedback("");
      reviewMutation.reset();
    }
  };

  const recordDecision = (
    submission: MentorSubmission,
    decision: ReviewDecision,
    notes?: string,
  ) => {
    const trimmed = notes?.trim();

    reviewMutation.mutate(
      {
        submissionId: submission.id,
        payload: {
          status: decision,
          feedback: trimmed ? trimmed : undefined,
        },
      },
      {
        onSuccess: (updated) => {
          toast.success(
            `${updated.projectName} was ${
              decision === "APPROVED" ? "approved" : "sent back for changes"
            }.`,
          );
          setActiveSubmission(updated);
          setIsDrawerOpen(false);
          setFeedback("");
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiRequestError
              ? error.message
              : "The review could not be recorded. Please try again.",
          );
        },
      },
    );
  };

  const handleDecision = (decision: ReviewDecision) => {
    if (!activeSubmission) {
      return;
    }

    recordDecision(activeSubmission, decision, feedback);
  };

  const handleQuickDecision = (
    submission: MentorSubmission,
    decision: ReviewDecision,
  ) => {
    recordDecision(submission, decision);
  };

  const handleRefresh = () => {
    void submissionsQuery.refetch();
    void statsQuery.refetch();
  };

  if (isUserResolving) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 w-full pt-16">
          <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6">
            <PageHeaderSkeleton />
            <SubmissionStatsSkeleton />
            <TableSkeleton />
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
              reviewing submissions.
            </p>
            <Button
              render={
                <Link href="/auth?tab=login&redirectTo=/mentor/dashboard" />
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

  if (user.role !== "MENTOR") {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 w-full pt-16 flex items-center justify-center px-6">
          <div className="max-w-md text-center flex flex-col gap-4">
            <span
              className="material-symbols-outlined text-[32px] text-outline mx-auto"
              aria-hidden="true"
            >
              block
            </span>
            <h1 className="text-headline-md text-on-surface">
              This dashboard is for mentors
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Your account does not have access to the review queue. Head back
              to your own dashboard to continue.
            </p>
            <Button
              render={<Link href="/student/dashboard" />}
              className="self-center"
            >
              Go to my dashboard
            </Button>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const isFiltering = Boolean(tableState.search || tableState.status);
  const isLoading = submissionsQuery.isPending;
  const hasFailed = submissionsQuery.isError;
  const busySubmissionId = reviewMutation.isPending
    ? reviewMutation.variables?.submissionId
    : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 w-full pt-16">
        <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6">
          <MentorDashboardHeader
            mentorName={user.name ?? "Mentor"}
            isRefreshing={submissionsQuery.isFetching}
            onRefresh={handleRefresh}
          />

          {statsQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle className="text-headline-sm">
                Could not load the overview metrics
              </AlertTitle>
              <AlertDescription className="text-body-sm">
                The counts above the table could not be read. The queue itself
                is unaffected — retry to load them again.
              </AlertDescription>
            </Alert>
          ) : statsQuery.isPending ? (
            <SubmissionStatsSkeleton />
          ) : (
            <SubmissionStatsGrid stats={stats} />
          )}

          <section
            aria-label="Submission queue"
            className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 overflow-hidden"
            aria-busy={submissionsQuery.isFetching}
          >
            <SubmissionToolbar
              search={searchInput}
              onSearchChange={handleSearchChange}
              status={tableState.status}
              onStatusChange={handleStatusChange}
              stats={stats}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />

            {isLoading ? (
              <SubmissionTableSkeleton />
            ) : hasFailed ? (
              <QueueLoadError
                error={submissionsQuery.error}
                onRetry={() => void submissionsQuery.refetch()}
                isRetrying={submissionsQuery.isFetching}
              />
            ) : submissions?.length === 0 ? (
              <SubmissionTableEmpty
                isFiltered={isFiltering}
                onReset={handleReset}
              />
            ) : submissions?.length > 0 ? (
              <>
                <div
                  className={
                    submissionsQuery.isFetching
                      ? "opacity-60 transition-opacity"
                      : "transition-opacity"
                  }
                >
                  <SubmissionTable
                    submissions={submissions}
                    sorting={tableState.sorting}
                    onSortingChange={handleSortingChange}
                    busySubmissionId={busySubmissionId}
                    isReviewing={reviewMutation.isPending}
                    onReview={handleOpenReview}
                    onDecision={handleQuickDecision}
                  />
                </div>

                <div className="border-t border-surface-container-high/60">
                  <SubmissionPagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    isFetching={submissionsQuery.isFetching}
                  />
                </div>
              </>
            ) : (
              <SubmissionTableSkeleton />
            )}
          </section>
        </div>
      </main>

      <AppFooter />

      <ReviewDrawer
        submission={activeSubmission}
        open={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        onSubmit={handleDecision}
        isSubmitting={reviewMutation.isPending}
        error={
          reviewMutation.error instanceof ApiRequestError
            ? reviewMutation.error.message
            : reviewMutation.error
              ? "The review could not be recorded. Please try again."
              : null
        }
      />
    </div>
  );
}

/**
 * Shown when the queue could not be loaded.
 *
 * This state says nothing about whether submissions exist, so it must not
 * claim that the queue is empty.
 */
function QueueLoadError({
  error,
  onRetry,
  isRetrying,
}: {
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const isForbidden = error instanceof ApiRequestError && error.status === 403;

  return (
    <div className="p-6 sm:p-7 border-t border-surface-container-high/60 flex flex-col gap-5">
      <Alert variant="destructive">
        <AlertTitle className="text-headline-sm">
          {isForbidden
            ? "This queue is not available to your account"
            : "Could not load the submission queue"}
        </AlertTitle>
        <AlertDescription className="text-body-sm">
          {isForbidden
            ? "Only mentor accounts can read the review queue."
            : "We could not reach the submission service. Nothing has been lost — please try again."}
        </AlertDescription>
      </Alert>

      {!isForbidden ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? "Retrying…" : "Try again"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Loading placeholder for the table card. */
function TableSkeleton() {
  return (
    <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 overflow-hidden">
      <div className="p-6 flex flex-col gap-4">
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-9 w-full max-w-lg" />
      </div>
      <SubmissionTableSkeleton />
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
