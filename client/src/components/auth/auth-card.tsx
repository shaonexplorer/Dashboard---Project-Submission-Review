"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  /** Top accent bar gradient */
  showAccentBar?: boolean;
}

export function AuthCard({
  children,
  className,
  showAccentBar = true,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-2xl shadow-xl p-7 md:p-9 relative overflow-hidden",
        className,
      )}
    >
      {showAccentBar && (
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-container to-secondary-container"
          aria-hidden="true"
        ></div>
      )}
      <div className="relative flex flex-col">{children}</div>
    </div>
  );
}