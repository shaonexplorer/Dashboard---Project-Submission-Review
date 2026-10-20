/**
 * Centralised TanStack Query keys.
 *
 * Keeping them here prevents the query and the invalidation calls from drifting
 * apart, which is the most common source of "the UI did not update" bugs.
 */
export const queryKeys = {
  currentUser: ["currentUser"] as const,
  submissions: {
    all: ["submissions"] as const,
    /** The authenticated student's own submission. */
    mine: ["submissions", "mine"] as const,
  },
} as const;
