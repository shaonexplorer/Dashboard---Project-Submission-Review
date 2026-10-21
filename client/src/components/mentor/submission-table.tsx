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
        cell: ({ getValue }) => (
          <span className="text-body-md text-on-surface font-medium">
            {getValue()}
          </span>
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
    <div className="w-full overflow-x-auto">
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
