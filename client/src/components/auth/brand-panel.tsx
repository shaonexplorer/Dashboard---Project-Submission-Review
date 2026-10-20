"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CohortBadge } from "./cohort-badge";
import { FeatureHighlight } from "./feature-highlight";
import { TerminalSnippet } from "./terminal-snippet";
import { SecurityBadges } from "./security-badges";

interface BrandPanelProps {
  /** Cohort/registration cycle text */
  cohortText?: string;
  /** Main headline */
  headline?: string;
  /** Sub-headline/description */
  description?: string;
  /** Feature highlights to display */
  features?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
  /** Terminal snippet content */
  terminal?: {
    prompt: string;
    lines: Array<{ text: string; className?: string }>;
  };
  /** Custom className */
  className?: string;
}

export function BrandPanel({
  cohortText = "WINTER 2025 EVALUATION CYCLE",
  headline = "Submit. Review. Ship.",
  description = "A single, authenticated gateway for students submitting production-grade course repos and mentors evaluating live merge requests.",
  features = [
    {
      icon: <span className="material-symbols-outlined text-[20px]">sync</span>,
      title: "Synchronous Student & Mentor Workflows",
      description: "Dynamic role routing directs students to project submissions and faculty to rubric evaluation queues.",
    },
    {
      icon: <span className="material-symbols-outlined text-[20px]">terminal</span>,
      title: "Git Metadata & Branch Attestation",
      description: "Automated validation of commit sign-offs, CI telemetry, and cohort repo branches.",
    },
  ],
  terminal = {
    prompt: "$ hub auth status --verified",
    lines: [
      { text: "> session: academic_id_980242" },
      { text: "> key_exchange: TLSv1.3 [AES-GCM-256]" },
      { text: "✓ ready for cohort assignment routing", className: "text-primary" },
    ],
  },
  className,
}: BrandPanelProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Cohort Badge */}
      <CohortBadge text={cohortText} />

      {/* Headline & Description */}
      <div className="space-y-3">
        <h1 className="text-display text-on-surface tracking-tight">{headline}</h1>
        <p className="text-body-lg text-on-surface-variant">{description}</p>
      </div>

      {/* Feature Highlights */}
      <div className="space-y-3.5 pt-2">
        {features.map((feature, index) => (
          <FeatureHighlight key={index} {...feature} />
        ))}
      </div>

      {/* Terminal/CLI Snippet */}
      <TerminalSnippet
        prompt={terminal.prompt}
        lines={terminal.lines}
      />

      {/* Security/Trust Badges */}
      <SecurityBadges />
    </div>
  );
}