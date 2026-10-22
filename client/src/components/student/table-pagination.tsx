"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/api/submissions";

export interface TablePaginationProps {
  /** Pagination metadata from the server */
  pagination: PaginationMeta;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
  /** True while a page is being fetched */
  isFetching?: boolean;
}

/**
 * Pagination footer for the student projects table.
 *
 * Shows the current range, total count, page size selector,
 * and page number buttons with previous/next.
 */
export function TablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  isFetching,
}: TablePaginationProps) {
  const { page, limit, total, totalPages } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    const startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      const adjustedStartPage = Math.max(1, endPage - maxVisible + 1);
      for (let i = adjustedStartPage; i <= endPage; i++) {
        pages.push(i);
      }
    } else {
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div
      className={cn(
        "px-6 py-3 bg-surface-container-low/40 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-4",
        isFetching && "opacity-60 transition-opacity",
      )}
    >
      <div className="flex items-center gap-4 text-secondary font-label-sm text-label-sm">
        <span className="text-on-surface-variant font-medium">
          Showing
          <span className="text-on-surface font-semibold">{start}–{end}</span> of
          <span className="text-on-surface font-semibold">{total}</span>
          projects
        </span>
        <div className="h-4 w-px bg-outline-variant/60 hidden sm:block" aria-hidden="true" />
        <div className="flex items-center gap-1.5">
          <span className="text-secondary">Show:</span>
          <select
            value={limit}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={isFetching}
            className="bg-surface-container-lowest text-on-surface border border-outline-variant/40 rounded px-2 py-0.5 font-label-sm text-label-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isFetching}
          className="px-2.5 py-1 rounded-lg font-label-sm text-label-sm text-secondary/60 flex items-center gap-0.5"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            chevron_left
          </span>
          <span>Previous</span>
        </Button>
        {pageNumbers.map((pageNum) => (
          <Button
            key={pageNum}
            variant={pageNum === page ? "default" : "ghost"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            disabled={isFetching}
            className={cn(
              "w-8 h-8 rounded-lg font-code-sm text-code-sm font-semibold",
              pageNum === page
                ? "bg-surface-container-high text-primary shadow-sm"
                : "text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors",
            )}
            aria-label={`Page ${pageNum}`}
            aria-current={pageNum === page ? "page" : undefined}
          >
            {pageNum}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isFetching}
          className="px-2.5 py-1 rounded-lg font-label-sm text-label-sm text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-0.5"
          aria-label="Next page"
        >
          <span>Next</span>
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            chevron_right
          </span>
        </Button>
      </div>
    </div>
  );
}