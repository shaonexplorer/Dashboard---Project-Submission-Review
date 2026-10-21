import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Shown when the API confirms the student has no submission.
 *
 * This is a distinct state from a load failure: the server answered, and the
 * answer was "there is nothing here". The action points at the form, which is
 * where a submission is created.
 */
export function SubmissionEmptyState() {
  return (
    <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/80 p-8 md:p-12 flex flex-col items-center text-center gap-5">
      <div className="size-14 rounded-2xl bg-surface-container flex items-center justify-center text-secondary">
        <span
          className="material-symbols-outlined text-[28px]"
          aria-hidden="true"
        >
          assignment
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-headline-md text-on-surface">
          You haven&apos;t submitted a project yet.
        </h2>
        <p className="text-body-md text-on-surface-variant max-w-md">
          Once you hand in a project, its details, its review status and the
          mentor feedback will be listed here.
        </p>
      </div>

      <Button
        render={<Link href="/student/dashboard" />}
        className="mt-2"
      >
        Go to the submission form
      </Button>
    </div>
  );
}
