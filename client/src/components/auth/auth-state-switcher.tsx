"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AuthState = "default" | "error" | "loading" | "disabled" | "success";

interface AuthStateSwitcherProps {
  /** Current state */
  state: AuthState;
  /** Callback when state changes */
  onStateChange: (state: AuthState) => void;
  /** Custom className */
  className?: string;
}

const STATES: Array<{ value: AuthState; label: string; iconColor: string }> = [
  { value: "default", label: "1. Default Clean", iconColor: "bg-primary" },
  { value: "error", label: "2. Validation Errors", iconColor: "bg-error" },
  { value: "loading", label: "3. Submitting State", iconColor: "bg-secondary" },
  { value: "success", label: "4. Signup Success", iconColor: "bg-emerald-600" },
];

export function AuthStateSwitcher({
  state,
  onStateChange,
  className,
}: AuthStateSwitcherProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <aside
      aria-label="UI state simulator"
      className={cn("w-full max-w-6xl mx-auto mb-8 px-4", className)}
    >
      <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 pl-2">
          <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">
            tune
          </span>
          <span className="text-label-md font-semibold tracking-wide text-on-surface">
            Interactive Demo State:
          </span>
        </div>
        <nav aria-label="Demo states" className="flex flex-wrap items-center gap-1.5">
          {STATES.map(({ value, label, iconColor }) => (
            <button
              key={value}
              type="button"
              onClick={() => onStateChange(value)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all flex items-center gap-1.5",
                state === value
                  ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
              )}
              aria-pressed={state === value}
            >
              <span className={cn("w-2 h-2 rounded-full", iconColor)} aria-hidden="true"></span>
              {label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}