"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SecurityBadgesProps {
  badges?: Array<{
    icon: React.ReactNode;
    label: string;
  }>;
  className?: string;
}

export function SecurityBadges({
  badges = [
    {
      icon: <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>,
      label: "Campus SAML 2.0",
    },
    {
      icon: <span className="material-symbols-outlined text-[18px] text-secondary">security</span>,
      label: "SOC 2 Type II",
    },
  ],
  className,
}: SecurityBadgesProps) {
  return (
    <div
      className={cn(
        "pt-6 border-t border-surface-container-high flex items-center gap-6 text-on-surface-variant",
        className,
      )}
    >
      {badges.map((badge, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center gap-2">
            {badge.icon}
            <span className="text-label-sm font-medium">{badge.label}</span>
          </div>
          {index < badges.length - 1 && (
            <span className="text-outline-variant font-mono text-xs">&#8226;</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}