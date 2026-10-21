interface RubricCriterion {
  name: string;
  points: number;
  description: string;
}

/** The target standard a submission is assessed against (100 points total). */
const RUBRIC_CRITERIA: RubricCriterion[] = [
  {
    name: "Architectural Soundness",
    points: 40,
    description:
      "Database schema, separation of concerns & API design",
  },
  {
    name: "Deployment & Stability",
    points: 30,
    description: "Live URL accessibility, error handling & SSL setup",
  },
  {
    name: "Git Hygiene & History",
    points: 20,
    description: "Atomic commits, clear messages & conventional syntax",
  },
  {
    name: "Performance & A11y",
    points: 10,
    description: "Lighthouse score >90 & keyboard navigable layouts",
  },
];

/**
 * Sidebar panel describing the evaluation rubric.
 *
 * Shows the target standard and its weighting. Per-criterion scores are only
 * rendered once the backend provides them — the frontend never invents a score.
 */
export function EvaluationRubricCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-label-md text-on-surface font-bold">
            Evaluation Rubric
          </h3>
          <p className="text-body-sm text-secondary">Target standard: 100 points</p>
        </div>
        <span className="text-code-sm px-2 py-0.5 rounded bg-surface-container-low text-secondary font-semibold">
          100 pts
        </span>
      </div>

      <div className="flex flex-col divide-y divide-surface-container-high/60">
        {RUBRIC_CRITERIA.map((criterion) => (
          <div key={criterion.name} className="py-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-label-md">
              <span className="text-on-surface font-medium">{criterion.name}</span>
              <span className="text-code-sm text-secondary">{criterion.points} pts</span>
            </div>
            <span className="text-[12px] text-secondary leading-normal">
              {criterion.description}
            </span>
            <div
              className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden mt-1"
              role="img"
              aria-label={`${criterion.name} is worth ${criterion.points} of 100 points`}
            >
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${criterion.points}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
