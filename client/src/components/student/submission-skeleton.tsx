import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder for the submission detail view.
 *
 * The skeleton mirrors the shape of the loaded view so the layout does not
 * jump once the response arrives.
 */
export function SubmissionSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your submission…</span>

      {/* Status panel */}
      <div className="rounded-xl bg-surface-container-low p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <Skeleton className="size-11 rounded-xl shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>

        <div className="pt-6 bg-surface-container-lowest/80 rounded-lg p-4 flex flex-col gap-4">
          <Skeleton className="h-3 w-56" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submission details */}
      <div className="rounded-xl bg-surface-container-lowest p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Skeleton className="h-[74px] w-full rounded-xl" />
          <Skeleton className="h-[74px] w-full rounded-xl" />
        </div>
      </div>

      {/* Mentor feedback */}
      <div className="rounded-xl bg-surface-container-lowest p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
