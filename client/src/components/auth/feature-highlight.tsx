"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FeatureHighlightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureHighlight({ icon, title, description, className }: FeatureHighlightProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-lowest shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0",
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-headline-sm text-on-surface font-medium">
          {title}
        </span>
        <span className="text-body-sm text-on-surface-variant mt-0.5">
          {description}
        </span>
      </div>
    </div>
  );
}