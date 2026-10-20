"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CohortBadgeProps {
  text: string;
  className?: string;
}

export function CohortBadge({ text, className }: CohortBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-on-secondary-container",
        className,
      )}
    >
      <span
        className="w-2 h-2 rounded-full bg-primary animate-pulse"
        aria-hidden="true"
      ></span>
      <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
        {text}
      </span>
    </div>
  );
}