"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  /** Error message */
  message: string;
  /** Optional title */
  title?: string;
  /** Custom className */
  className?: string;
  /** Whether banner is visible */
  isVisible?: boolean;
}

export function ErrorBanner({
  message,
  title,
  className,
  isVisible = true,
}: ErrorBannerProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "p-3.5 rounded-xl bg-error-container text-on-error-container flex items-start gap-3 animate-in fade-in duration-200",
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5" aria-hidden="true">
        error
      </span>
      <div className="flex flex-col">
        {title && (
          <span className="text-headline-sm font-semibold">{title}</span>
        )}
        <span className="text-body-sm mt-0.5">{message}</span>
      </div>
    </div>
  );
}

interface InlineErrorProps {
  /** Error message */
  message: string;
  /** Custom className */
  className?: string;
  /** Whether error is visible */
  isVisible?: boolean;
}

export function InlineError({
  message,
  className,
  isVisible = true,
}: InlineErrorProps) {
  if (!isVisible) return null;

  return (
    <p
      className={cn(
        "text-xs text-error font-medium flex items-center gap-1.5 mt-0.5",
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
        info
      </span>
      {message}
    </p>
  );
}