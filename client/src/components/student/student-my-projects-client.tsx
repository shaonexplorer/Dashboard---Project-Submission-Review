"use client";

import { useState, useMemo, useEffect } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useMySubmissionsPaginated,
  useMySubmissionStats,
  useCreateSubmission,
} from "@/hooks/use-submissions";
import { useProjects } from "@/hooks/use-projects";
import { AppFooter, AppHeader } from "@/components/layout";
import {
  MetricCard,
  SearchFilterBar,
  StudentProjectsTable,
  TablePagination,
  KeyboardShortcutsStrip,
  AcademicIntegrityCard,
  NewSubmissionModal,
} from "@/components/student";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/lib/api/client";
import type {
  StudentProjectRow,
  StudentSubmissionListQuery,
  Submission,
} from "@/lib/api/submissions";
import type { SubmissionFormValues } from "@/lib/validations/submission";
import type { SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

/** Rows per page. The server enforces the same maximum. */
const PAGE_SIZE = 10;

/** The sort the queue starts with. */
const INITIAL_SORTING: SortingState = [{ id: "createdAt", desc: true }];

/** The columns the server is able to sort by. */
const SORT_FIELDS: readonly ("createdAt" | "projectName" | "status")[] = [
  "createdAt",
  "projectName",
  "status",
];

function toSortField(
  id: string | undefined,
): "createdAt" | "projectName" | "status" {
  return SORT_FIELDS.find((field) => field === id) ?? "createdAt";
}

interface StudentMyProjectsClientProps {
  /** Initial data from Server Component for hydration */
  initialProjects: StudentProjectRow[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialStats: {
    total: number;
    pending: number;
    active: number;
    approved: number;
    rejected: number;
    archived: number;
  };
  initialProjectsCatalog: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  }[];
}

export function StudentMyProjectsClient({
  initialProjects,
  initialPagination,
  initialStats,
  initialProjectsCatalog,
}: StudentMyProjectsClientProps) {
  // Table state - synced with URL
  const [searchInput, setSearchInput] = useState("");
  const [sorting, setSorting] = useState<SortingState>(INITIAL_SORTING);
  const [statusFilter, setStatusFilter] =
    useState<StudentSubmissionListQuery["status"]>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedProject, setPreSelectedProject] =
    useState<StudentProjectRow | null>(null);

  const router = useRouter();

  // Debounce search input to avoid firing a request on every keystroke
  const search = useDebouncedValue(searchInput, 400);

  // Derive API sortBy and sortOrder from TanStack Table sorting state
  const apiSortBy = useMemo((): StudentSubmissionListQuery["sortBy"] => {
    const sort = sorting[0];
    if (!sort) return "createdAt";
    if (sort.id === "project") return "projectName";
    if (sort.id === "status") return "status";
    return "createdAt";
  }, [sorting]);

  const apiSortOrder = useMemo((): StudentSubmissionListQuery["sortOrder"] => {
    const sort = sorting[0];
    return sort?.desc ? "desc" : "asc";
  }, [sorting]);

  // Build query for paginated API
  const query = useMemo<StudentSubmissionListQuery>(
    () => ({
      page,
      limit,
      search: search || undefined,
      status: statusFilter,
      sortBy: apiSortBy,
      sortOrder: apiSortOrder,
    }),
    [page, limit, search, statusFilter, apiSortBy, apiSortOrder],
  );

  const {
    data: paginatedData,
    isPending: isSubmissionPending,
    isError: isSubmissionError,
    error: submissionError,
    isFetching: isRefetching,
    refetch: refetchSubmissions,
  } = useMySubmissionsPaginated(query, {
    initialData: {
      submissions: initialProjects,
      pagination: initialPagination,
    },
  });

  const { data: stats } = useMySubmissionStats({
    initialData: initialStats,
  });

  const createSubmissionMutation = useCreateSubmission();

  const { data: projects = [] } = useProjects({
    initialData: initialProjectsCatalog,
  });

  const displayProjects = paginatedData?.submissions ?? initialProjects;
  const displayPagination = paginatedData?.pagination ?? initialPagination;
  const displayStats = stats ?? initialStats;

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));

    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }

    if (statusFilter) {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }

    if (sorting[0]) {
      params.set("sortBy", sorting[0].id);
      params.set("sortOrder", sorting[0].desc ? "desc" : "asc");
    }

    router.replace(`/student/my-projects?${params.toString()}`, {
      scroll: false,
    });
  }, [page, limit, search, statusFilter, sorting, router]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sorting]);

  // Handle 401 errors
  useEffect(() => {
    if (
      submissionError instanceof ApiRequestError &&
      submissionError.status === 401
    ) {
      router.replace("/auth?tab=login&redirectTo=/student/my-projects");
    }
  }, [submissionError, router]);

  function handleStartSubmission(project: StudentProjectRow) {
    setPreSelectedProject(project);
    setIsModalOpen(true);
  }

  function handleViewFeedback(submission: Submission | undefined) {
    if (!submission) return;
    router.push(`/student/submission/${submission.id}`);
  }

  function handleTrackStatus(submission: Submission | undefined) {
    if (!submission) return;
    router.push(`/student/submission/${submission.id}`);
  }

  function handleReviewComments(submission: Submission | undefined) {
    if (!submission) return;
    router.push(`/student/submission/${submission.id}`);
  }

  function handleViewArchive(submission: Submission | undefined) {
    if (!submission) return;
    router.push(`/student/submission/${submission.id}`);
  }

  async function handleSubmitDeliverable(values: SubmissionFormValues) {
    try {
      await createSubmissionMutation.mutateAsync(values);
      setIsModalOpen(false);
      void refetchSubmissions();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="flex-1 w-full pt-16">
        <div className="max-w-[1440px] w-full mx-auto px-6 py-10 flex flex-col gap-6">
          {/* Breadcrumb & Cohort Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="mt-5 flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
              <span className="text-secondary">Student Portal</span>
              <span
                className="material-symbols-outlined text-[16px]"
                aria-hidden="true"
              >
                chevron_right
              </span>
              <span className="text-on-surface font-medium">My Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container-low text-on-secondary-container font-label-sm text-label-sm shadow-sm">
                <span
                  className="w-2 h-2 rounded-full bg-primary animate-pulse"
                  aria-hidden="true"
                />
                <span>
                  Current Cohort:
                  <strong className="font-semibold text-on-surface">
                    {" "}
                    Cohort 24-B
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Metric Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              label="Milestones Tracked"
              value={displayStats.total ?? 0}
              subtitle="/ 6 active"
              icon="timeline"
              indicatorColor="emerald"
              trendLabel="3 active"
              trendColor="emerald"
            />
            <MetricCard
              label="Completed / Approved"
              value={displayStats.approved ?? 0}
              subtitle={`94/100 Avg`}
              icon="check_circle"
              indicatorColor="primary"
              trendLabel="94/100 Avg"
              trendColor="primary"
            />
            <MetricCard
              label="Under Evaluation"
              value={displayStats.active ?? 0}
              icon="hourglass_top"
              indicatorColor="amber"
              trendLabel="In Queue"
              trendColor="amber"
            />
            <MetricCard
              label="Pending Submission"
              value={displayStats.total ?? 0}
              icon="schedule"
              indicatorColor="secondary"
              trendLabel="24d Remaining"
              trendColor="secondary"
            />
          </div>

          {/* Search & Filter Bar */}
          <SearchFilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            onSubmitClick={() => {
              setPreSelectedProject(null);
              setIsModalOpen(true);
            }}
            isSearching={isRefetching}
          />

          {/* Projects Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 overflow-hidden flex flex-col">
            <div className="overflow-x-auto w-full">
              {isSubmissionPending ? (
                <TableSkeleton />
              ) : isSubmissionError ? (
                <div className="p-6 text-center text-body-md text-on-surface-variant">
                  Failed to load submissions
                </div>
              ) : displayProjects?.length === 0 ? (
                <div className="p-6 text-center text-body-md text-on-surface-variant">
                  No projects found. Adjust your filters or start a new
                  submission.
                </div>
              ) : (
                <StudentProjectsTable
                  projects={displayProjects}
                  sorting={sorting}
                  onSortingChange={setSorting}
                  busyProjectId={createSubmissionMutation.variables?.projectId}
                  isSubmitting={createSubmissionMutation.isPending}
                  onSubmitDeliverable={handleStartSubmission}
                  onViewFeedback={handleViewFeedback}
                  onTrackStatus={handleTrackStatus}
                  onReviewComments={handleReviewComments}
                  onViewArchive={handleViewArchive}
                />
              )}
            </div>

            {/* Table Pagination */}
            {displayProjects?.length > 0 && (
              <TablePagination
                pagination={displayPagination}
                onPageChange={setPage}
                onPageSizeChange={setLimit}
                isFetching={isRefetching}
              />
            )}

            {/* Keyboard Shortcuts Strip */}
            <KeyboardShortcutsStrip />
          </div>

          {/* Academic Integrity Card */}
          <AcademicIntegrityCard />

          {/* New Submission Modal */}
          <NewSubmissionModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSubmit={handleSubmitDeliverable}
            isSubmitting={createSubmissionMutation.isPending}
            defaultProjectId={preSelectedProject?.project.id}
          />
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

// Skeleton components
function TableSkeleton() {
  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-surface-container-low/70 border-b border-outline-variant/40 text-secondary font-label-sm text-label-sm uppercase tracking-wider">
        <tr>
          <th className="p-4 w-10 text-center">
            <Skeleton className="w-4 h-4 rounded mx-auto" />
          </th>
          <th className="py-3 px-4">
            <Skeleton className="h-3 w-32" />
          </th>
          <th className="py-3 px-4">
            <Skeleton className="h-3 w-20" />
          </th>
          <th className="py-3 px-4">
            <Skeleton className="h-3 w-24" />
          </th>
          <th className="py-3 px-4">
            <Skeleton className="h-3 w-24" />
          </th>
          <th className="py-3 px-4">
            <Skeleton className="h-3 w-20" />
          </th>
          <th className="py-3 px-4 text-right pr-6">
            <Skeleton className="h-3 w-20 mx-auto" />
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/30">
        {[0, 1, 2, 3, 4].map((row) => (
          <tr key={row} className="hover:bg-surface-container-low/40">
            <td className="p-4 text-center">
              <Skeleton className="w-4 h-4 rounded mx-auto" />
            </td>
            <td className="py-3 px-4">
              <div className="flex flex-col gap-0.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48" />
              </div>
            </td>
            <td className="py-3 px-4">
              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
            </td>
            <td className="py-3 px-4">
              <div className="flex flex-col gap-0.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
            </td>
            <td className="py-3 px-4">
              <Skeleton className="h-6 w-32 rounded-full" />
            </td>
            <td className="py-3 px-4">
              <div className="flex flex-col gap-0.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </td>
            <td className="py-3 px-4 text-right">
              <div className="flex justify-end gap-1">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
