"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Academic integrity footer card.
 *
 * Shows the submission standards and a link to rubric guidelines.
 */
export function AcademicIntegrityCard() {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest p-6 rounded-xl shadow-sm",
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[22px]" aria-hidden="true">
            policy
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-on-surface">
            Submission Standards & Academic Integrity
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            All repository submissions are scanned for original work,
            automated test coverage, and security vulnerabilities.
          </span>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="shrink-0 flex items-center gap-1 font-medium">
        <span>Read Rubric Guidelines</span>
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
          open_in_new
        </span>
      </Button>
    </div>
  );
}