"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PrimaryActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button text */
  children: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Loading text */
  loadingText?: string;
  /** Icon to show in normal state */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: "start" | "end";
  /** Custom className */
  className?: string;
}

export function PrimaryActionButton({
  children,
  isLoading = false,
  loadingText = "Please wait...",
  icon,
  iconPosition = "start",
  className,
  disabled,
  ...props
}: PrimaryActionButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={cn(
        "w-full h-11 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold tracking-wide",
        "flex items-center justify-center gap-2 shadow-sm",
        "hover:bg-primary transition-all active:scale-[0.99]",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-5 w-5 text-on-primary"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              fill="currentColor"
            ></path>
          </svg>
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {iconPosition === "start" && icon && (
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {icon}
            </span>
          )}
          <span>{children}</span>
          {iconPosition === "end" && icon && (
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
}