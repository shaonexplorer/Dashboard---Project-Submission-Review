/**
 * Centralised TanStack Query keys.
 *
 * Keeping them here prevents the query and the invalidation calls from drifting
 * apart, which is the most common source of "the UI did not update" bugs.
 */
export const queryKeys = {
  currentUser: ["currentUser"] as const,
  /**
   * Canonical cache entry for the authenticated student's own submission.
   *
   * The key is part of the submission contract: the query that loads the
   * submission and every mutation that changes it must target this exact key,
   * otherwise the UI can drift away from the backend.
   */
  mySubmission: ["mySubmission"] as const,
} as const;
