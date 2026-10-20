"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const defaultRequirements: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    test: (password) => /[0-9]/.test(password),
  },
];

interface PasswordStrengthProps {
  /** Current password value */
  password: string;
  /** Custom requirements (defaults to 4 standard ones) */
  requirements?: PasswordRequirement[];
  /** Title for the checklist */
  title?: string;
  /** Custom className */
  className?: string;
}

export function PasswordStrength({
  password,
  requirements = defaultRequirements,
  title = "Password Security Policy:",
  className,
}: PasswordStrengthProps) {
  return (
    <div
      className={cn(
        "mt-1.5 p-3 rounded-lg bg-surface-container-low space-y-1.5",
        className,
      )}
      role="group"
      aria-label={title}
    >
      <span className="text-label-sm text-on-surface font-medium block">
        {title}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-on-surface-variant text-body-sm">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-1.5 transition-colors duration-200",
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[16px] transition-all duration-200",
                  passed ? "text-emerald-600" : "text-outline",
                )}
                aria-hidden="true"
              >
                {passed ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span
                className={cn(
                  "transition-colors duration-200",
                  passed ? "text-emerald-700 dark:text-emerald-400 font-medium" : "",
                )}
              >
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Hook to check password strength in real-time */
export function usePasswordStrength(password: string, requirements = defaultRequirements) {
  return React.useMemo(
    () => requirements.map((req) => ({
      ...req,
      passed: req.test(password),
    })),
    [password, requirements],
  );
}