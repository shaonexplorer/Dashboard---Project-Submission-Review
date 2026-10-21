import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "./stat-card";
import type { SubmissionStats } from "@/lib/api/mentor-submissions";

/**
 * The four statistics cards of the mentor dashboard.
 *
 * Every number is the one the server reported: the counts describe the whole
 * table, not the rows the table currently holds.
 *
 * The chips beside the values repeat the status a card is about — each with
 * its own colour and dot — so the four cards can be told apart at a glance
 * without reading their labels.
 */
export function SubmissionStatsGrid({ stats }: { stats: SubmissionStats }) {
  const total = Math.max(stats.total, 0);

  const shareOf = (value: number) => (total === 0 ? 0 : (value / total) * 100);
  const percent = (value: number) => `${shareOf(value).toFixed(1)}%`;

  return (
    <section aria-label="Submission overview" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
          Overview Metrics
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Submissions"
          value={total}
          icon="folder_open"
          iconClassName="bg-surface-container text-on-surface-variant"
          barClassName="bg-primary"
          share={total === 0 ? 0 : 100}
          chip="All time"
          hint="Active cycle"
          detail="Every submission"
          detailClassName="text-on-surface-variant"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon="schedule"
          iconClassName="bg-secondary-container text-on-secondary-container"
          barClassName="bg-secondary"
          share={shareOf(stats.pending)}
          chip="Awaiting review"
          chipDotClassName="bg-secondary animate-pulse"
          chipClassName="bg-secondary-container text-on-secondary-container font-semibold"
          hint="Review queue"
          detail={`${percent(stats.pending)} of total`}
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon="check_circle"
          iconClassName="bg-surface-container-high text-primary"
          barClassName="bg-tertiary-container"
          share={shareOf(stats.approved)}
          chip={`${percent(stats.approved)} pass rate`}
          chipDotClassName="bg-tertiary"
          chipClassName="bg-surface-container text-on-surface font-semibold"
          hint="Benchmark met"
          detail="Approved work"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon="cancel"
          iconClassName="bg-error-container/60 text-on-error-container"
          barClassName="bg-error"
          share={shareOf(stats.rejected)}
          chip={`${percent(stats.rejected)} revisions`}
          chipDotClassName="bg-error"
          chipClassName="bg-error-container text-on-error-container font-semibold"
          hint="Action required"
          detail="Pending re-submit"
          detailClassName="text-error font-semibold"
        />
      </div>
    </section>
  );
}

/**
 * Placeholder for the statistics cards.
 *
 * The shape matches the real cards so the page does not jump when the counts
 * arrive.
 */
export function SubmissionStatsSkeleton() {
  return (
    <section aria-label="Submission overview" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-28" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-[var(--shadow-1)]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
