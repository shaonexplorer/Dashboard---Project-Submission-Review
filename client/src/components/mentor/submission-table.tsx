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
import { SubmissionStatusBadge } from "@/components/submissions";
import { formatUrlLabel, formatUtcDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  MentorSubmission,
  ReviewDecision,
} from "@/lib/api/mentor-submissions";
import { StudentAvatar } from "./student-avatar";
import { SubmissionActions } from "./submission-actions";

const columnHelper = createColumnHelper<MentorSubmission>();

export interface SubmissionTableProps {
  /** The rows the server returned for the current page. */
  submissions: MentorSubmission[];
  /** The active sorting state. */
  sorting: SortingState;
  /** Called when the user sorts by a column header. */
  onSortingChange: OnChangeFn<SortingState>;
  /** The id of the submission whose review request is in flight. */
  busySubmissionId: string | undefined;
  /** True while any review request is in flight. */
  isReviewing: boolean;
  /** Opens the review drawer for a submission. */
  onReview: (submission: MentorSubmission) => void;
  /** Records a review decision for a submission. */
  onDecision: (submission: MentorSubmission, decision: ReviewDecision) => void;
}

/**
 * The mentor submission table.
 *
 * Pagination, filtering, searching and sorting are all performed by the
 * server: the table is configured with `manualPagination`, `manualFiltering`
 * and `manualSorting`, and the rows it renders are exactly the rows the API
 * returned for the current query state.
 */
export function SubmissionTable({
  submissions,
  sorting,
  onSortingChange,
  busySubmissionId,
  isReviewing,
  onReview,
  onDecision,
}: SubmissionTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.student.fullName, {
        id: "student",
        header: "Student",
        // The backend cannot sort by a joined student name, so the column
        // does not offer a sort control.
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-0 ">
            <StudentAvatar
              name={row.original.student.fullName}
              studentId={row.original.student.id}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-label-md text-on-surface font-semibold">
                {row.original.student.fullName}
              </span>
              <span className="truncate text-code-sm text-on-surface-variant max-w-[130px]">
                {row.original.student.email}
              </span>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("projectName", {
        header: "Project",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-code-sm text-code-sm uppercase font-semibold text-secondary">
                {row.original.projectId}
              </span>
              <span className="truncate text-body-md text-on-surface font-medium">
                {row.original.projectName}
              </span>
            </div>
            {row.original.attempt > 1 ? (
              <span className="w-fit px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm">
                Attempt {row.original.attempt}
              </span>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("repoUrl", {
        id: "repoUrl",
        header: "Repository",
        enableSorting: false,
        cell: ({ getValue }) => {
          const url = getValue();

          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-code-sm text-primary hover:underline"
            >
              <span
                className="material-symbols-outlined text-[15px]"
                aria-hidden="true"
              >
                code
              </span>
              <span className="max-w-[130px] truncate">
                {formatUrlLabel(url)}
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          );
        },
      }),
      columnHelper.accessor("liveUrl", {
        id: "liveUrl",
        header: "Live Link",
        enableSorting: false,
        cell: ({ getValue }) => {
          const url = getValue();

          if (!url) {
            return (
              <span
                className="text-body-sm text-on-surface-variant"
                aria-label="No live link provided"
              >
                —
              </span>
            );
          }

          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-code-sm text-primary hover:underline"
            >
              <span
                className="material-symbols-outlined text-[15px]"
                aria-hidden="true"
              >
                public
              </span>
              <span className="max-w-[100px] truncate">
                {formatUrlLabel(url)}
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => <SubmissionStatusBadge status={getValue()} />,
      }),
      columnHelper.accessor((row) => row.submittedAt, {
        // The backend sorts by the creation timestamp, so the column carries
        // that id even though the row exposes it as `submittedAt`.
        id: "createdAt",
        header: "Submitted At",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-code-sm text-on-surface-variant">
            {formatUtcDateTime(getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <SubmissionActions
            submission={row.original}
            isBusy={busySubmissionId === row.original.id}
            isLocked={isReviewing && busySubmissionId !== row.original.id}
            onReview={onReview}
            onDecision={onDecision}
          />
        ),
      }),
    ],
    [busySubmissionId, isReviewing, onDecision, onReview],
  );

  const table = useReactTable({
    data: submissions,
    columns,
    state: { sorting },
    onSortingChange,
    // The server owns the data set: the table never filters, sorts or
    // paginates the rows it has been given.
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    // The queue is always ordered by something: removing the sort would leave
    // the client without a direction to send while the server keeps its own
    // default, and the two would disagree.
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    // The submission id is the row identity, so a row keeps its identity
    // across pages and refetches.
    getRowId: (row) => row.id,
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
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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
          <MobileSubmissionCard
            key={row.id}
            submission={row.original}
            isBusy={busySubmissionId === row.original.id}
            isLocked={isReviewing && busySubmissionId !== row.original.id}
            onReview={onReview}
            onDecision={onDecision}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A table header that sorts the table when activated.
 *
 * The sort state lives outside the table, so the click handler is the one the
 * dashboard passed in — the header only reports that sorting was requested.
 */
function SortableHeader({
  column,
}: {
  column: Column<MentorSubmission, unknown>;
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
 * Mobile card layout for a single submission.
 * Shown on screens smaller than lg (1024px).
 */
function MobileSubmissionCard({
  submission,
  isBusy,
  isLocked,
  onReview,
  onDecision,
}: {
  submission: MentorSubmission;
  isBusy: boolean;
  isLocked: boolean;
  onReview: (submission: MentorSubmission) => void;
  onDecision: (submission: MentorSubmission, decision: ReviewDecision) => void;
}) {
  return (
    <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <StudentAvatar
          name={submission.student.fullName}
          studentId={submission.student.id}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-label-md text-on-surface font-semibold truncate">
                {submission.student.fullName}
              </p>
              <p className="text-code-sm text-on-surface-variant truncate">
                {submission.student.email}
              </p>
            </div>
            <SubmissionStatusBadge status={submission.status} />
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-code-sm text-code-sm uppercase font-semibold text-secondary flex-shrink-0">
                {submission.projectId}
              </span>
              <span className="truncate text-body-md text-on-surface font-medium">
                {submission.projectName}
              </span>
            </div>
            {submission.attempt > 1 && (
              <span className="w-fit px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-code-sm text-code-sm">
                Attempt {submission.attempt}
              </span>
            )}
            <a
              href={submission.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-code-sm text-primary hover:underline"
            >
              <span
                className="material-symbols-outlined text-[15px]"
                aria-hidden="true"
              >
                code
              </span>
              <span className="truncate max-w-[150px]">
                {formatUrlLabel(submission.repoUrl)}
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            {submission.liveUrl && (
              <a
                href={submission.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-code-sm text-primary hover:underline"
              >
                <span
                  className="material-symbols-outlined text-[15px]"
                  aria-hidden="true"
                >
                  public
                </span>
                <span className="truncate max-w-[120px]">
                  {formatUrlLabel(submission.liveUrl)}
                </span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
            <span className="text-code-sm text-on-surface-variant">
              {formatUtcDateTime(submission.submittedAt)}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onReview(submission)}
              disabled={isBusy || isLocked}
              className="flex-1 h-10 px-4 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {isBusy ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    ></path>
                  </svg>
                  Loading…
                </>
              ) : (
                "Review"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
