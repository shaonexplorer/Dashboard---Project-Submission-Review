/** Pre-flight criteria students must satisfy before a submission can be scored. */
const PREFLIGHT_CHECKS = [
  "Public repository with visible commit lineage",
  "Comprehensive README.md with setup instructions",
  "Active deploy responding with 200 OK status",
  "No exposed API keys or .env secrets",
];

/**
 * Sidebar panel listing the criteria a submission is checked against.
 *
 * Informational only — the platform does not run these checks itself yet.
 */
export function PreflightCriteriaCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-label-md text-on-surface font-bold">
            Pre-Flight Criteria
          </h3>
          <p className="text-body-sm text-secondary">
            Checked by mentors during review.
          </p>
        </div>
        <span
          className="material-symbols-outlined text-primary text-[18px]"
          aria-hidden="true"
        >
          verified
        </span>
      </div>

      <ul className="divide-y divide-surface-container-high/60 text-body-sm text-on-surface">
        {PREFLIGHT_CHECKS.map((check) => (
          <li key={check} className="py-2.5 flex items-start gap-2.5">
            <span
              className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5"
              aria-hidden="true"
            >
              check
            </span>
            <span>{check}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
