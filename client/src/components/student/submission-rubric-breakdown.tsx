"use client";

import { cn } from "@/lib/utils";

interface RubricCriterionScore {
  name: string;
  maxPoints: number;
  earnedPoints: number;
  description: string;
  /** Optional feedback specific to this criterion */
  feedback?: string;
}

interface RubricBreakdownProps {
  /** The criteria with earned scores (only available after review) */
  criteria?: RubricCriterionScore[];
  /** Total score if available */
  totalScore?: number;
  /** Whether the rubric is for a rejected submission (shows what needs improvement) */
  isRejected?: boolean;
  /** Whether we're in a loading state */
  isLoading?: boolean;
}

/** Default rubric criteria (target standard). */
const DEFAULT_CRITERIA: Omit<RubricCriterionScore, "earnedPoints" | "feedback">[] = [
  {
    name: "Architectural Soundness",
    maxPoints: 40,
    description: "Database schema, separation of concerns & API design",
  },
  {
    name: "Deployment & Stability",
    maxPoints: 30,
    description: "Live URL accessibility, error handling & SSL setup",
  },
  {
    name: "Git Hygiene & History",
    maxPoints: 20,
    description: "Atomic commits, clear messages & conventional syntax",
  },
  {
    name: "Performance & A11y",
    maxPoints: 10,
    description: "Lighthouse score >90 & keyboard navigable layouts",
  },
];

/**
 * Detailed rubric breakdown with per-criterion scores.
 *
 * When scores are available (after review), shows earned vs max points.
 * When not available (pending), shows the target standard with progress bars.
 * For rejected submissions, highlights areas needing improvement.
 */
export function SubmissionRubricBreakdown({
  criteria,
  totalScore,
  isRejected = false,
  isLoading,
}: RubricBreakdownProps) {
  const hasScores = criteria && criteria.length > 0;
  const displayCriteria: RubricCriterionScore[] = hasScores
    ? criteria
    : DEFAULT_CRITERIA.map((c) => ({ ...c, earnedPoints: 0 }));

  const calculatedTotal = hasScores
    ? displayCriteria.reduce((sum, c) => sum + c.earnedPoints, 0)
    : 0;
  const maxTotal = displayCriteria.reduce((sum, c) => sum + c.maxPoints, 0);
  const displayTotal = totalScore ?? calculatedTotal;

  const getProgressColor = (earned: number, max: number) => {
    const ratio = earned / max;
    if (ratio >= 0.9) return "bg-emerald-500";
    if (ratio >= 0.7) return "bg-primary";
    if (ratio >= 0.5) return "bg-amber-500";
    return "bg-error";
  };

  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-surface-container-highest rounded" />
          <div className="h-5 w-20 bg-surface-container-highest rounded-full" />
        </div>
        <div className="flex flex-col divide-y divide-surface-container-high/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-4 space-y-2">
              <div className="h-4 w-3/4 bg-surface-container-highest rounded" />
              <div className="h-1 w-full bg-surface-container-highest rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-label-md text-on-surface font-bold">
            {isRejected ? "Rubric Breakdown — Areas for Improvement" : "Evaluation Rubric"}
          </h3>
          <p className="text-body-sm text-secondary">
            {hasScores
              ? `Scored ${displayTotal} / ${maxTotal} points`
              : "Target standard: 100 points"}
          </p>
        </div>
        <span className={cn(
          "text-code-sm px-3 py-1 rounded-full font-semibold",
          hasScores
            ? isRejected
              ? "bg-error-container text-error"
              : displayTotal >= 90
                ? "bg-emerald-50 text-emerald-800"
                : displayTotal >= 70
                  ? "bg-primary-container text-on-primary"
                  : "bg-amber-50 text-amber-800"
            : "bg-surface-container-low text-secondary",
        )}>
          {hasScores ? `${displayTotal}/${maxTotal} pts` : "100 pts"}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-surface-container-high/60">
        {displayCriteria.map((criterion) => {
          const earned = hasScores ? criterion.earnedPoints : 0;
          const ratio = earned / criterion.maxPoints;
          const isLowScore = hasScores && ratio < 0.7;

          return (
            <div
              key={criterion.name}
              className={cn(
                "py-3 flex flex-col gap-1.5",
                isLowScore && "bg-error-container/30 rounded-lg px-3 -mx-3",
              )}
            >
              <div className="flex items-center justify-between text-label-md">
                <span className={cn(
                  "text-on-surface font-medium",
                  isLowScore && "text-error",
                )}>
                  {criterion.name}
                </span>
                <span className={cn(
                  "text-code-sm font-medium",
                  isLowScore ? "text-error" : "text-secondary",
                )}>
                  {hasScores ? `${earned}/${criterion.maxPoints} pts` : `${criterion.maxPoints} pts`}
                </span>
              </div>
              <span className="text-[12px] text-secondary leading-normal">
                {criterion.description}
              </span>
              <div
                className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden mt-1"
                role="img"
                aria-label={
                  hasScores
                    ? `${criterion.name}: earned ${earned} of ${criterion.maxPoints} points`
                    : `${criterion.name} is worth ${criterion.maxPoints} of ${maxTotal} points`
                }
              >
                <div
                  className={cn("h-full rounded-full transition-all duration-500", getProgressColor(earned, criterion.maxPoints))}
                  style={{ width: hasScores ? `${ratio * 100}%` : `${(criterion.maxPoints / maxTotal) * 100}%` }}
                />
              </div>
              {hasScores && criterion.feedback && (
                <div className="pl-2 pt-1 border-l-2 border-surface-container-high/60">
                  <p className="text-code-sm text-on-surface-variant italic">
                    {criterion.feedback}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasScores && (
        <div className="pt-2 border-t border-surface-container-high/60 flex items-center justify-between">
          <span className="text-label-md text-on-surface font-bold">
            Total Score
          </span>
          <span className={cn(
            "text-headline-sm font-bold",
            isRejected
              ? "text-error"
              : displayTotal >= 90
                ? "text-emerald-600"
                : displayTotal >= 70
                  ? "text-primary"
                  : "text-amber-600",
          )}>
            {displayTotal} / {maxTotal}
          </span>
        </div>
      )}

      {!hasScores && (
        <p className="text-body-sm text-on-surface-variant text-center pt-2">
          Scores will appear here once the review is complete.
        </p>
      )}
    </div>
  );
}