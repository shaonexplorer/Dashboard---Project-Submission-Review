"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Leading icon component */
  leadingIcon?: React.ReactNode;
  /** Trailing icon component */
  trailingIcon?: React.ReactNode;
  /** Error message to display */
  error?: string;
  /** Label text */
  label?: string;
  /** Hint text */
  hint?: string;
  /** Whether the input is in error state (for styling) */
  isError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      leadingIcon,
      trailingIcon,
      error,
      label,
      hint,
      isError,
      id,
      disabled,
      required,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const hintId = hint ? `${id}-hint` : undefined;
    const describedBy = [ariaDescribedBy, errorId, hintId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-label-md font-medium text-on-surface"
          >
            {label}
            {required && <span className="text-error ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          {leadingIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant"
              aria-hidden="true"
            >
              {leadingIcon}
            </div>
          )}

          <input
            type={type}
            id={id}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={isError ? "true" : "false"}
            aria-describedby={describedBy}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest text-on-surface rounded-lg",
              "font-body-md text-body-md shadow-xs placeholder:text-outline",
              "focus:outline-none focus:bg-surface-container-lowest transition-all",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isError && "ring-2 ring-error bg-error-container/20",
              trailingIcon && "pr-11",
              className,
            )}
            {...props}
          />

          {trailingIcon && (
            <div
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none"
            >
              {trailingIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="text-xs text-error font-medium flex items-center gap-1.5"
            role="alert"
            aria-live="polite"
          >
            <span className="material-symbols-outlined text-[15px]">info</span>
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="text-label-sm text-on-surface-variant">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };