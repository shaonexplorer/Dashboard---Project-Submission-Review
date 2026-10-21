import type { SubmissionStatus } from "@/lib/api/submissions";

/** The lifecycle stages that lead up to the decision. */
const PRE_DECISION_STAGES = ["Submitted", "In Queue", "Evaluation"] as const;

/** Label of the final stage, which carries the outcome. */
const DECISION_LABEL: Record<SubmissionStatus, string> = {
  PENDING: "Decision",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

type StageState = "complete" | "active" | "todo";

/**
 * Derives the lifecycle stage states from the submission status.
 *
 * The stages are a visualisation of the status the server returned — no
 * timeline data is invented, and the frontend never derives a status of its own.
 */
function deriveStageStates(status: SubmissionStatus): StageState[] {
  if (status === "PENDING") {
    return ["complete", "active", "todo", "todo"];
  }
  return ["complete", "complete", "complete", "complete"];
}

/**
 * The "Verification & Lifecycle Audit Trail" stepper.
 *
 * Shows how far the submission has travelled through review. Every step is
 * derived from the status the API returned; the stepper never guesses.
 */
export function LifecycleStepper({ status }: { status: SubmissionStatus }) {
  const states = deriveStageStates(status);
  const stages = [...PRE_DECISION_STAGES, DECISION_LABEL[status]];

  return (
    <div className="pt-6 bg-surface-container-lowest/80 backdrop-blur-sm rounded-lg p-4">
      <div className="text-label-sm text-code-sm text-secondary uppercase tracking-wider mb-4">
        Verification &amp; Lifecycle Audit Trail
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {stages.map((stage, index) => {
          const state = states[index];
          const isDecision = index === stages.length - 1;

          return (
            <li key={stage} className="flex flex-col gap-1 relative">
              <div className="flex items-center gap-2">
                <div
                  className={`size-6 rounded-full flex items-center justify-center text-[13px] ${
                    isDecision && status === "APPROVED"
                      ? "bg-primary-container text-on-primary shadow-sm"
                      : isDecision && status === "REJECTED"
                        ? "bg-error-container text-error shadow-sm"
                        : state === "todo"
                          ? "bg-surface-container-high text-secondary"
                          : state === "active"
                            ? "bg-primary-container text-on-primary shadow-sm"
                            : "bg-primary text-on-primary"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[14px]"
                    aria-hidden="true"
                  >
                    {isDecision && status === "APPROVED"
                      ? "check"
                      : isDecision && status === "REJECTED"
                        ? "close"
                        : state === "complete"
                          ? "done"
                          : state === "active"
                            ? "check"
                            : "more_horiz"}
                  </span>
                </div>
                <span
                  className={`text-label-md font-semibold ${
                    state === "todo" ? "text-secondary" : "text-on-surface"
                  }`}
                >
                  {stage}
                </span>
              </div>
              <span className="text-label-sm text-secondary pl-8 sm:pl-0 sm:pt-1">
                {state === "complete"
                  ? "Completed"
                  : state === "active"
                    ? "In progress"
                    : "Upcoming"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
