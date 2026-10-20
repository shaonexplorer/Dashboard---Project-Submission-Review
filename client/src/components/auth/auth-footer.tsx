"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthFooterProps {
  /** Primary action link (e.g., "Create student account" -> /signup) */
  primaryAction?: {
    text: string;
    link: string;
    linkText: string;
  };
  /** Secondary action link (e.g., "Already have an account?" -> /login) */
  secondaryAction?: {
    text: string;
    link: string;
    linkText: string;
  };
  /** Show routing hint card */
  showRoutingHint?: boolean;
  /** Student dashboard route */
  studentRoute?: string;
  /** Mentor dashboard route */
  mentorRoute?: string;
  /** Custom className */
  className?: string;
}

export function AuthFooter({
  primaryAction,
  secondaryAction,
  showRoutingHint = true,
  studentRoute = "/student/dashboard",
  mentorRoute = "/mentor/dashboard",
  className,
}: AuthFooterProps) {
  return (
    <div
      className={cn(
        "mt-8 pt-6 border-t border-surface-container-high space-y-3.5",
        className,
      )}
    >
      {primaryAction && (
        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
          <p className="text-body-sm text-on-surface-variant">
            {primaryAction.text}{" "}
            <Link
              href={primaryAction.link}
              className="text-primary hover:underline font-semibold ml-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              {primaryAction.linkText}
            </Link>
          </p>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
            <span className="text-code-sm">SAML 2.0 Auth Ready</span>
          </div>
        </div>
      )}

      {secondaryAction && (
        <div className="text-center">
          <p className="text-body-sm text-on-surface-variant">
            {secondaryAction.text}{" "}
            <Link
              href={secondaryAction.link}
              className="text-primary hover:underline font-semibold ml-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              {secondaryAction.linkText}
            </Link>
          </p>
        </div>
      )}

      {showRoutingHint && (
        <div
          className="p-3 rounded-lg bg-surface-container flex items-start gap-2.5 text-on-secondary-container"
          role="note"
        >
          <span
            className="material-symbols-outlined text-[17px] text-primary shrink-0 mt-0.5"
            aria-hidden="true"
          >
            alt_route
          </span>
          <p className="text-body-sm">
            <strong className="font-semibold text-on-surface">
              Unified Gateway Routing:
            </strong>{" "}
            Students automatically route to
            <span
              className="text-code-sm bg-surface-container-lowest px-1 py-0.5 rounded text-primary font-mono"
            >
              {studentRoute}
            </span>{" "}
            and Faculty/Mentors route to
            <span
              className="text-code-sm bg-surface-container-lowest px-1 py-0.5 rounded text-primary font-mono"
            >
              {mentorRoute}
            </span>{" "}
            upon identity verification.
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-surface-container-high flex items-center justify-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-emerald-600" aria-hidden="true">
          lock
        </span>
        <span className="text-label-sm">
          Protected via 256-bit TLS & Academic Verification
        </span>
      </div>
    </div>
  );
}