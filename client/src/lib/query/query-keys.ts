/**
 * Centralised TanStack Query keys.
 *
 * Keeping them here prevents the query and the invalidation calls from drifting
 * apart, which is the most common source of "the UI did not update" bugs.
 */
export const queryKeys = {
  currentUser: ["currentUser"] as const,
  /**
   * Canonical cache entry for the authenticated student's own submissions.
   *
   * The key is part of the submission contract: the query that loads the
   * submissions and every mutation that changes them must target this exact
   * key, otherwise the UI can drift away from the backend.
   */
  mySubmissions: ["mySubmissions"] as const,
  /**
   * Cache entry for the student's submission statistics.
   */
  mySubmissionsStats: ["mySubmissions", "stats"] as const,
  /**
   * A single page of the student's own submission table.
   *
   * The whole query state is part of the key — page, limit, search, status,
   * sort field and sort direction — so every change of server-controlled state
   * produces a different cache entry and therefore a new server request.
   */
  mySubmissionsPaginated: <T extends object>(query: T) =>
    ["mySubmissions", "paginated", query] as const,
  /**
   * The project catalog.
   *
   * The catalog is read-only and effectively static, so it lives under its
   * own key: invalidating the student's submissions must not force the picker
   * to refetch the catalog.
   */
  projects: ["projects"] as const,
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
