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
  /**
   * Root key of the mentor dashboard data.
   *
   * Every mentor query lives under this prefix, so invalidating it refreshes
   * the table and the statistics cards together — a review decision changes
   * both, and the two must never disagree.
   */
  mentorDashboard: ["mentorDashboard"] as const,
  /**
   * A single page of the mentor submission table.
   *
   * The whole query state is part of the key — page, limit, search, status,
   * sort field and sort direction — so every change of server-controlled state
   * produces a different cache entry and therefore a new server request.
   */
  mentorSubmissions: <T extends object>(query: T) =>
    ["mentorDashboard", "submissions", query] as const,
  /**
   * The aggregate counts shown in the statistics cards.
   */
  mentorSubmissionStats: ["mentorDashboard", "submissionStats"] as const,
} as const;
