"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Column,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { formatUrlLabel, formatUtcDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudentProjectRow } from "@/lib/api/submissions";

const columnHelper = createColumnHelper<StudentProjectRow>();

export interface StudentProjectsTableProps {
  /** The rows for the current page */
  projects: StudentProjectRow[];
  /** Active sorting state */
  sorting: SortingState;
  /** Called when user sorts by a column header */
  onSortingChange: OnChangeFn<SortingState>;
  /** ID of the project whose submission is in flight */
  busyProjectId?: string;
  /** True while any submission is in flight */
  isSubmitting?: boolean;
  /** Callback to open submission modal for a project */
  onSubmitDeliverable: (project: StudentProjectRow) => void;
  /** Callback to view feedback for a submission */
  onViewFeedback?: (submission: StudentProjectRow["submission"]) => void;
  /** Callback to track status for a submission */
  onTrackStatus?: (submission: StudentProjectRow["submission"]) => void;
  /** Callback to view review comments */
  onReviewComments?: (submission: StudentProjectRow["submission"]) => void;
  /** Callback to view archive */
  onViewArchive?: (submission: StudentProjectRow["submission"]) => void;
}

/**
 * Student Projects Table using TanStack Table.
 *
 * Server-side pagination, filtering, searching and sorting are handled
 * by the API. The table is configured with manual* options and renders
 * exactly the rows returned for the current query state.
 */
export function StudentProjectsTable({
  projects = [],
  sorting,
  onSortingChange,
  busyProjectId,
  isSubmitting,
  onSubmitDeliverable,
  onViewFeedback,
  onTrackStatus,
  onReviewComments,
  onViewArchive,
}: StudentProjectsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-outline-variant/60 text-primary focus:ring-primary/20 cursor-pointer"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-outline-variant/60 text-primary focus:ring-primary/20 cursor-pointer"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label={`Select ${row.original.project.name}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      }),
      columnHelper.accessor((row) => row.project, {
        id: "project",
        header: "Milestone & Project Name",
        cell: ({ row }) => {
          const { project, submission, state } = row.original;
          const isCurrent = state === "in-review";

          return (
            <div className="flex flex-col gap-0.5 min-w-[240px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-code-sm text-code-sm uppercase font-semibold text-secondary">
                  {project.id}
                </span>
                <span
                  className={cn(
                    "font-headline-sm text-headline-sm text-on-surface font-semibold hover:text-primary transition-colors truncate max-w-[200px]",
                    isCurrent && "text-primary",
                  )}
                >
                  {project.name}
                </span>
                {isCurrent && (
                  <span className="px-2 py-0.2 rounded bg-primary/10 text-primary font-code-sm text-code-sm font-medium uppercase">
                    Current
                  </span>
                )}
                {submission && submission.attempt > 1 && (
                  <span className="w-fit px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm">
                    Attempt {submission.attempt}
                  </span>
                )}
              </div>
              {project.description && (
                <span className="text-body-sm text-secondary font-normal line-clamp-1 max-w-md">
                  {project.description}
                </span>
              )}
            </div>
          );
        },
      }),
      // columnHelper.accessor((row) => row.project, {
      //   id: "techStack",
      //   header: "Tech Stack",
      //   enableSorting: false,
      //   cell: ({ row }) => {
      //     // In a real app, tech stack would come from project metadata
      //     // For now, we'll show a placeholder based on project ID
      //     const techStacks: Record<string, string[]> = {
      //       "ph-01": ["TypeScript", "React", "Next.js"],
      //       "ph-02": ["Go", "Redis", "Docker", "gRPC"],
      //       "ph-03": ["Kafka", "ClickHouse", "Rust"],
      //       "ph-04": ["C++", "Raft", "ZeroMQ"],
      //       "ph-00": ["C", "Linux", "Makefile"],
      //     };
      //     const stacks = techStacks[row.original.project.id] || [];

      //     return (
      //       <div className="flex flex-wrap items-center gap-1 min-w-[200px]">
      //         {stacks.map((stack) => (
      //           <span
      //             key={stack}
      //             className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm"
      //           >
      //             {stack}
      //           </span>
      //         ))}
      //         {stacks.length === 0 && (
      //           <span className="text-body-sm text-on-surface-variant">—</span>
      //         )}
      //       </div>
      //     );
      //   },
      // }),
      columnHelper.accessor((row) => row.submission, {
        id: "repository",
        header: "Repository & Commit",
        enableSorting: false,
        cell: ({ row }) => {
          const submission = row.original.submission;

          if (!submission) {
            return (
              <div className="flex items-center gap-1 font-body-sm text-secondary italic min-w-[220px]">
                <span
                  className="material-symbols-outlined text-[16px]"
                  aria-hidden="true"
                >
                  link_off
                </span>
                <span>Not linked yet</span>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-0.5 min-w-[220px]">
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-code-sm text-code-sm text-primary hover:underline flex items-center gap-1"
              >
                <span
                  className="material-symbols-outlined text-[16px] text-secondary"
                  aria-hidden="true"
                >
                  code
                </span>
                <span className="truncate max-w-[170px]">
                  {formatUrlLabel(submission.repoUrl)}
                </span>
              </a>
              <div className="flex items-center gap-1 font-code-sm text-code-sm text-secondary">
                <span
                  className="material-symbols-outlined text-[14px]"
                  aria-hidden="true"
                >
                  commit
                </span>
                <span>#{submission.id.slice(0, 7)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-on-surface p-0.5 rounded h-6 w-6"
                  onClick={() =>
                    navigator.clipboard.writeText(submission.id.slice(0, 7))
                  }
                  aria-label="Copy commit SHA"
                >
                  <span
                    className="material-symbols-outlined text-[13px]"
                    aria-hidden="true"
                  >
                    content_copy
                  </span>
                </Button>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.submission?.status, {
        id: "status",
        header: "Status / Grade",
        cell: ({ row }) => {
          const { submission, state } = row.original;

          if (!submission) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-secondary-container font-label-sm text-label-sm font-medium">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-secondary"
                  aria-hidden="true"
                />
                <span>Draft · Due in 24d</span>
              </span>
            );
          }

          if (state === "approved") {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-medium">
                <span
                  className="material-symbols-outlined text-[14px] text-emerald-600"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                <span>Approved · 94/100</span>
              </span>
            );
          }

          if (state === "rejected") {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-medium">
                <span
                  className="material-symbols-outlined text-[14px]"
                  aria-hidden="true"
                >
                  error
                </span>
                <span>Changes Required</span>
              </span>
            );
          }

          return (
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 font-label-sm text-label-sm font-medium">
              <span
                className="w-2 h-2 rounded-full bg-amber-500 animate-ping"
                aria-hidden="true"
              />
              <span>Under Review</span>
            </span>
          );
        },
      }),
      columnHelper.accessor((row) => row.submission?.submittedAt, {
        id: "timeline",
        header: "Timeline",
        cell: ({ row }) => {
          const { submission, state } = row.original;

          if (!submission) {
            return (
              <div className="flex flex-col gap-0.5 min-w-[150px] whitespace-nowrap">
                <span className="text-on-surface font-medium">
                  Due Dec 18, 2026
                </span>
                <span className="text-secondary font-code-sm text-code-sm">
                  23:59 UTC
                </span>
              </div>
            );
          }

          if (state === "approved") {
            return (
              <div className="flex flex-col gap-0.5 min-w-[150px] whitespace-nowrap">
                <span className="text-on-surface font-medium">Completed</span>
                <span className="text-secondary font-code-sm text-code-sm">
                  {formatUtcDateTime(
                    submission.reviewedAt || submission.submittedAt,
                  )}
                </span>
              </div>
            );
          }

          if (state === "rejected") {
            return (
              <div className="flex flex-col gap-0.5 min-w-[150px] whitespace-nowrap">
                <span className="text-on-surface font-medium">Evaluated</span>
                <span className="text-secondary font-code-sm text-code-sm">
                  {formatUtcDateTime(
                    submission.reviewedAt || submission.submittedAt,
                  )}
                </span>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-0.5 min-w-[150px] whitespace-nowrap">
              <span className="text-on-surface font-medium">
                Submitted Today
              </span>
              <span className="text-secondary font-code-sm text-code-sm">
                {formatUtcDateTime(submission.submittedAt)
                  .split(",")[1]
                  ?.trim() || "09:14 UTC"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableHiding: false,
        size: 160,
        cell: ({ row }) => {
          const { submission, state } = row.original;
          const isBusy = busyProjectId === row.original.project.id;

          const actionButtons = () => {
            if (!submission) {
              return (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSubmitDeliverable(row.original)}
                    disabled={isSubmitting}
                    className="px-3 py-1 rounded-lg font-label-sm text-label-sm text-primary hover:bg-surface-container-low transition-colors font-medium flex items-center gap-1"
                  >
                    <span>Start Submission</span>
                    <span
                      className="material-symbols-outlined text-[15px]"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  </Button>
                </div>
              );
            }

            if (state === "approved") {
              return (
                <div className="flex items-center justify-end gap-1">
                  {onViewFeedback && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewFeedback!(submission)}
                      className="px-3 py-1 rounded-lg font-label-sm text-label-sm text-primary hover:bg-surface-container-low transition-colors font-medium flex items-center gap-1"
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        aria-hidden="true"
                      >
                        fact_check
                      </span>
                      <span>View Feedback</span>
                    </Button>
                  )}
                </div>
              );
            }

            if (state === "in-review") {
              return (
                <div className="flex items-center justify-end gap-1">
                  {onTrackStatus && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onTrackStatus!(submission)}
                      disabled={isBusy}
                      className="px-space-sm py-1 rounded-lg font-label-sm text-label-sm bg-primary-container text-on-primary hover:bg-primary transition-colors font-medium flex items-center gap-1 shadow-sm"
                    >
                      <span
                        className="material-symbols-outlined text-[15px]"
                        aria-hidden="true"
                      >
                        hourglass_top
                      </span>
                      <span>Track Status</span>
                    </Button>
                  )}
                </div>
              );
            }

            if (state === "rejected") {
              return (
                <div className="flex items-center justify-end gap-1">
                  {onReviewComments && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReviewComments!(submission)}
                      className="px-space-sm py-1 rounded-lg font-label-sm text-label-sm text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors font-medium flex items-center gap-1"
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        aria-hidden="true"
                      >
                        rate_review
                      </span>
                      <span>Review Comments</span>
                    </Button>
                  )}
                </div>
              );
            }

            return (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-1 text-secondary hover:text-on-surface rounded-lg hover:bg-surface-container-low transition-colors"
                  aria-label="More options"
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    aria-hidden="true"
                  >
                    more_vert
                  </span>
                </Button>
              </div>
            );
          };

          return (
            <div className="flex items-center justify-end gap-1 pr-6">
              {actionButtons()}
            </div>
          );
        },
      }),
    ],
    [
      busyProjectId,
      isSubmitting,
      onSubmitDeliverable,
      onViewFeedback,
      onTrackStatus,
      onReviewComments,
      onViewArchive,
    ],
  );

  const table = useReactTable({
    data: projects,
    columns,
    state: { sorting },
    onSortingChange,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.project?.id,
  });

  return (
    <div className="w-full">
      {/* Desktop Table - hidden on mobile */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : canSort
                              ? "none"
                              : undefined
                      }
                      style={{ width: header.column.getSize() }}
                    >
                      {canSort ? (
                        <SortableHeader column={header.column} />
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "hover:bg-surface-container-low/40 transition-colors group",
                  row.original.state === "in-review" &&
                    "bg-surface-container-low/20",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout - visible on mobile, hidden on desktop */}
      <div className="lg:hidden space-y-3 p-4">
        {table.getRowModel().rows.map((row) => (
          <MobileProjectCard
            key={row.id}
            project={row.original}
            isBusy={busyProjectId === row.original.project.id}
            isSubmitting={isSubmitting ?? false}
            onSubmitDeliverable={onSubmitDeliverable}
            onViewFeedback={onViewFeedback}
            onTrackStatus={onTrackStatus}
            onReviewComments={onReviewComments}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A table header that sorts the table when activated.
 */
function SortableHeader({
  column,
}: {
  column: Column<StudentProjectRow, unknown>;
}) {
  const sorted = column.getIsSorted();
  const label = String(column.columnDef.header ?? "");

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      aria-label={`Sort by ${label}`}
      className="group inline-flex items-center gap-1.5 rounded-md text-label-sm uppercase tracking-wider font-semibold text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
      <span
        className={cn(
          "material-symbols-outlined text-[15px]",
          sorted ? "text-primary" : "text-outline",
        )}
        aria-hidden="true"
      >
        {sorted === "asc"
          ? "arrow_upward"
          : sorted === "desc"
            ? "arrow_downward"
            : "unfold_more"}
      </span>
    </button>
  );
}

/**
 * Mobile card layout for a single project.
 * Shown on screens smaller than lg (1024px).
 */
function MobileProjectCard({
  project,
  isBusy,
  isSubmitting,
  onSubmitDeliverable,
  onViewFeedback,
  onTrackStatus,
  onReviewComments,
}: {
  project: StudentProjectRow;
  isBusy: boolean;
  isSubmitting: boolean;
  onSubmitDeliverable: (project: StudentProjectRow) => void;
  onViewFeedback?: (submission: StudentProjectRow["submission"]) => void;
  onTrackStatus?: (submission: StudentProjectRow["submission"]) => void;
  onReviewComments?: (submission: StudentProjectRow["submission"]) => void;
}) {
  const { project: proj, submission, state } = project;
  const isCurrent = state === "in-review";

  function getStatusBadge() {
    if (!submission) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-secondary-container font-label-sm text-label-sm font-medium">
          <span
            className="w-1.5 h-1.5 rounded-full bg-secondary"
            aria-hidden="true"
          />
          <span>Draft · Due in 24d</span>
        </span>
      );
    }

    if (state === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-medium">
          <span
            className="material-symbols-outlined text-[14px] text-emerald-600"
            aria-hidden="true"
          >
            check_circle
          </span>
          <span>Approved · 94/100</span>
        </span>
      );
    }

    if (state === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-medium">
          <span
            className="material-symbols-outlined text-[14px]"
            aria-hidden="true"
          >
            error
          </span>
          <span>Changes Required</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 font-label-sm text-label-sm font-medium">
        <span
          className="w-2 h-2 rounded-full bg-amber-500 animate-ping"
          aria-hidden="true"
        />
        <span>Under Review</span>
      </span>
    );
  }

  function getTimeline() {
    if (!submission) {
      return (
        <div className="flex flex-col gap-0.5 min-w-[150px] whitespace-nowrap">
          <span className="text-on-surface font-medium">Due Dec 18, 2026</span>
          <span className="text-secondary font-code-sm text-code-sm">
            23:59 UTC
          </span>
        </div>
      );
    }

    if (state === "approved") {
      return (
        <div className="flex flex-col gap-0.5 min-w-[150px] whitespace-nowrap">
          <span className="text-on-surface font-medium">Completed</span>
          <span className="text-secondary font-code-sm text-code-sm">
            {formatUtcDateTime(submission.reviewedAt || submission.submittedAt)}
          </span>
        </div>
      );
    }

    if (state === "rejected") {
      return (
        <div className="flex flex-col gap-0.5 min-w-[150px] whitespace-nowrap">
          <span className="text-on-surface font-medium">Evaluated</span>
          <span className="text-secondary font-code-sm text-code-sm">
            {formatUtcDateTime(submission.reviewedAt || submission.submittedAt)}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5 min-w-[150px] whitespace-nowrap">
        <span className="text-on-surface font-medium">Submitted Today</span>
        <span className="text-secondary font-code-sm text-code-sm">
          {formatUtcDateTime(submission.submittedAt).split(",")[1]?.trim() ||
            "09:14 UTC"}
        </span>
      </div>
    );
  }

  function getActionButtons() {
    if (!submission) {
      return (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onSubmitDeliverable(project)}
            disabled={isSubmitting}
            className="flex-1 h-10 px-4 rounded-lg border border-primary text-primary font-label-md text-label-md font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Start Submission
            <span
              className="material-symbols-outlined text-[15px] ml-1"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </button>
        </div>
      );
    }

    if (state === "approved") {
      return (
        <div className="flex items-center justify-end gap-1">
          {onViewFeedback && (
            <button
              type="button"
              onClick={() => onViewFeedback!(submission)}
              className="flex-1 h-10 px-4 rounded-lg border border-primary text-primary font-label-md text-label-md font-semibold hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span
                className="material-symbols-outlined text-[16px] mr-1"
                aria-hidden="true"
              >
                fact_check
              </span>
              <span>View Feedback</span>
            </button>
          )}
        </div>
      );
    }

    if (state === "in-review") {
      return (
        <div className="flex items-center justify-end gap-1">
          {onTrackStatus && (
            <button
              type="button"
              onClick={() => onTrackStatus!(submission)}
              disabled={isBusy}
              className="flex-1 h-10 px-4 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span
                className="material-symbols-outlined text-[15px] mr-1"
                aria-hidden="true"
              >
                hourglass_top
              </span>
              <span>Track Status</span>
            </button>
          )}
        </div>
      );
    }

    if (state === "rejected") {
      return (
        <div className="flex items-center justify-end gap-1">
          {onReviewComments && (
            <button
              type="button"
              onClick={() => onReviewComments!(submission)}
              className="flex-1 h-10 px-4 rounded-lg border border-secondary text-secondary font-label-md text-label-md font-semibold hover:bg-surface-container-low transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            >
              <span
                className="material-symbols-outlined text-[16px] mr-1"
                aria-hidden="true"
              >
                rate_review
              </span>
              <span>Review Comments</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          className="h-10 w-10 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="More options"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            aria-hidden="true"
          >
            more_vert
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-code-sm text-code-sm uppercase font-semibold text-secondary flex-shrink-0">
            {proj.id}
          </span>
          <span
            className={cn(
              "font-headline-sm text-headline-sm text-on-surface font-semibold truncate max-w-[200px]",
              isCurrent && "text-primary",
            )}
          >
            {proj.name}
          </span>
          {isCurrent && (
            <span className="px-2 py-0.2 rounded bg-primary/10 text-primary font-code-sm text-code-sm font-medium uppercase flex-shrink-0">
              Current
            </span>
          )}
          {submission && submission.attempt > 1 && (
            <span className="w-fit px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm flex-shrink-0">
              Attempt {submission.attempt}
            </span>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {proj.description && (
        <p className="text-body-sm text-secondary font-normal line-clamp-2 mb-3">
          {proj.description}
        </p>
      )}

      <div className="space-y-2 mb-3">
        {submission ? (
          <a
            href={submission.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-code-sm text-code-sm text-primary hover:underline flex items-center gap-1"
          >
            <span
              className="material-symbols-outlined text-[16px] text-secondary"
              aria-hidden="true"
            >
              code
            </span>
            <span className="truncate max-w-[170px]">
              {formatUrlLabel(submission.repoUrl)}
            </span>
          </a>
        ) : (
          <div className="flex items-center gap-1 font-body-sm text-secondary italic">
            <span
              className="material-symbols-outlined text-[16px]"
              aria-hidden="true"
            >
              link_off
            </span>
            <span>Not linked yet</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {getTimeline()}
        <div className="flex-1 flex items-center justify-end">
          {getActionButtons()}
        </div>
      </div>
    </div>
  );
}
