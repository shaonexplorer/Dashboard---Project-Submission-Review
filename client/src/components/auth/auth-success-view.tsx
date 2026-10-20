"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthSuccessViewProps {
  /** Email that was registered */
  email?: string;
  /** Custom success title */
  title?: string;
  /** Custom success description */
  description?: string;
  /** Primary action (usually "Continue to Sign in") */
  primaryAction?: {
    text: string;
    href: string;
  };
  /** Secondary action (usually "Register another account") */
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  /** Custom className */
  className?: string;
}

export function AuthSuccessView({
  email,
  title = "Account created successfully!",
  description = "Your student account has been registered. You can now sign in to your dashboard to submit your project and link your GitHub repositories.",
  primaryAction = {
    text: "Continue to Sign in",
    href: "/login",
  },
  secondaryAction,
  className,
}: AuthSuccessViewProps) {
  return (
    <div
      className={cn(
        "flex-col items-center text-center py-6 px-2",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* Animated Green Check Badge */}
      <div className="relative w-20 h-20 mb-6 flex items-center justify-center" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30"></div>
        <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-[34px]">done_all</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-label-sm font-semibold mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true"></span>
        Cohort Gateway Authenticated
      </div>

      <h2 className="text-headline-lg text-on-surface font-bold tracking-tight">
        {title}
      </h2>

      <p className="mt-2.5 text-body-md text-on-surface-variant max-w-md">
        {description}
      </p>

      {/* Verification Notification Callout */}
      {email && (
        <div className="mt-6 w-full p-4 rounded-xl bg-surface-container-low flex items-start gap-3 text-left">
          <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5" aria-hidden="true">
            mark_email_read
          </span>
          <div className="flex flex-col">
            <span className="text-headline-sm text-on-surface font-medium">
              Verification link dispatched
            </span>
            <span className="text-body-sm text-on-surface-variant mt-0.5">
              Verification link sent to
              <span className="font-mono text-on-surface font-medium">
                {email}
              </span>
              . Please verify within 24 hours to preserve cohort priority.
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 w-full space-y-3">
        <Link
          href={primaryAction.href}
          className={cn(
            "w-full h-11 rounded-lg bg-primary-container hover:bg-primary text-on-primary",
            "font-label-md text-label-md font-semibold tracking-wide",
            "flex items-center justify-center gap-2 shadow-sm transition-all",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          )}
        >
          <span>{primaryAction.text}</span>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            arrow_forward
          </span>
        </Link>

        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="w-full py-2 text-label-sm text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            {secondaryAction.text}
          </button>
        )}
      </div>
    </div>
  );
}