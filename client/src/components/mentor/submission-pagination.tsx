"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/api/mentor-submissions";

export interface SubmissionPaginationProps {
  /** The pagination metadata the server returned. */
  pagination: PaginationMeta;
  /** Called with the 1-based page number the user asked for. */
  onPageChange: (page: number) => void;
  /** True while a page is being fetched. */
  isFetching?: boolean;
}

/**
 * The pager below the submission table.
 *
 * Every number it shows comes from the server's pagination metadata: the
 * number of pages, the number of records and the page size are all read from
 * the response, never inferred from the rows that happen to be on screen.
 */
export function SubmissionPagination({
  pagination,
  onPageChange,
  isFetching = false,
}: SubmissionPaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  const hasPrevious = page > 1;
  const hasNext = totalPages > 0 && page < totalPages;

  const firstRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRow = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
      <div className="flex items-center gap-4">
        <span className="text-body-sm text-on-surface-variant">
          Showing{" "}
          <span className="font-semibold text-on-surface">
            {total === 0 ? "0" : `${firstRow}–${lastRow}`}
          </span>{" "}
          of <span className="font-semibold text-on-surface">{total}</span>{" "}
          submissions
        </span>

        <div className="hidden items-center gap-2 md:flex">
          <span className="text-code-sm text-on-surface-variant">
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasPrevious || isFetching}
          onClick={() => onPageChange(page - 1)}
        >
          <span
            className="material-symbols-outlined text-[16px]"
            aria-hidden="true"
          >
            chevron_left
          </span>
          Previous
        </Button>

        {pageNumbers(page, totalPages).map((pageNumber, index) =>
          pageNumber === null ? (
            <span
              key={`gap-${index}`}
              className="px-1 text-code-sm text-on-surface-variant"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              disabled={isFetching}
              aria-current={pageNumber === page ? "page" : undefined}
              aria-label={`Go to page ${pageNumber}`}
              className={cn(
                "size-8 rounded-lg text-code-sm font-semibold transition-colors disabled:opacity-50",
                pageNumber === page
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface hover:bg-surface-container",
              )}
            >
              {pageNumber}
            </button>
          ),
        )}

        <Button
          variant="secondary"
          size="sm"
          disabled={!hasNext || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <span
            className="material-symbols-outlined text-[16px]"
            aria-hidden="true"
          >
            chevron_right
          </span>
        </Button>
      </div>
    </div>
  );
}

/**
 * The page numbers to show, with `null` marking an elided range.
 *
 * The window follows the current page so the pager stays a fixed size no
 * matter how many pages the table has.
 */
function pageNumbers(current: number, totalPages: number): (number | null)[] {
  if (totalPages <= 1) {
    return totalPages === 1 ? [1] : [];
  }

  const window = 2;
  const pages = new Set<number>([1, totalPages]);

  for (
    let page = current - window;
    page <= current + window;
    page += 1
  ) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  let previous = 0;

  for (const page of sorted) {
    if (previous && page - previous > 1) {
      result.push(null);
    }
    result.push(page);
    previous = page;
  }

  return result;
}
