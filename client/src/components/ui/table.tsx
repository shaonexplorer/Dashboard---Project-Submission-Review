"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Table primitives.
 *
 * A thin, unopinionated wrapper around the native table elements. The wrapper
 * handles horizontal scrolling, so a table that is wider than its container
 * can scroll sideways instead of hiding columns.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

/** The header row group of a table. */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-surface-container-low", className)}
      {...props}
    />
  );
}

/** The body row group of a table. */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("divide-y divide-surface-container", className)}
      {...props}
    />
  );
}

/** The footer row group of a table. */
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-surface-container-low", className)}
      {...props}
    />
  );
}

/** A single row. */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors hover:bg-surface-container-low/70",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A header cell.
 *
 * Headers are styled as small uppercase labels, matching the density of the
 * surrounding design system.
 */
function TableHead({
  className,
  "aria-sort": ariaSort,
  ...props
}: React.ComponentProps<"th"> & { "aria-sort"?: "ascending" | "descending" | "none" }) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        "px-4 py-2.5 text-left align-middle font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

/** A body cell. */
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}

/** The caption of a table, describing it for assistive technologies. */
function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-label-sm text-on-surface-variant", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
